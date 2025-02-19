import { maybeIt } from '../../support/utils';
import flaggedReport from '../../fixtures/reports/flagged.json';
import unflaggedReport from '../../fixtures/reports/unflagged.json';
import upsertDuplicateClassification from '../../fixtures/classifications/upsertDuplicateClassification.json';
import updateIncident50 from '../../fixtures/incidents/updateIncident50.json';
import { format, getUnixTime } from 'date-fns';
import updateOneIncidentFlagged from '../../fixtures/incidents/updateOneIncidentFlagged.json';
import incident10 from '../../fixtures/incidents/fullIncident10.json';
import { transformIncidentData, deleteIncidentTypenames } from '../../../src/utils/cite';
import { transformReportData, deleteReportTypenames } from '../../../src/utils/reports';
const { gql } = require('@apollo/client');

describe('Cite pages', () => {
  const discoverUrl = '/apps/discover';

  const incidentId = 10;

  const url = `/cite/${incidentId}`;

  let user;

  before('before', function () {
    // Skip all tests if the environment is empty since /cite/{incident_id} is not available
    Cypress.env('isEmptyEnvironment') && this.skip();

    cy.query({
      query: gql`
        {
          user(query: { first_name: "Test", last_name: "User" }) {
            userId
            first_name
            last_name
          }
        }
      `,
    }).then(({ data: { user: userData } }) => {
      user = userData;
    });
  });

  maybeIt('Should show an edit link to users with the appropriate role', {}, () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    const id = 'r3';

    cy.visit('/cite/1#' + id);

    cy.get(`#${id} [data-cy="edit-report"]`).click();

    cy.waitForStableDOM();

    cy.url().should('contain', '/cite/edit/?report_number=3');
  });

  it('Successfully loads', () => {
    cy.visit(url);
  });

  // skipping until https://github.com/responsible-ai-collaborative/aiid/pull/1680/files is merged
  it.skip(
    'Should scroll to report when coming from the discover app',
    { retries: { runMode: 4 } },
    () => {
      cy.visit(discoverUrl);

      cy.disableSmoothScroll();

      cy.waitForStableDOM();

      cy.get('[data-cy="collapse-button"]:visible').click();

      cy.contains('Show Details on Incident #10').first().click();
      cy.waitForStableDOM();
      cy.url().should('include', '/cite/10/#r23');
      cy.waitForStableDOM();

      cy.contains('h5', '​Is Starbucks shortchanging its baristas?', { timeout: 8000 })
        .parents('[data-cy="incident-report-card"]')
        .then((subject) => {
          expect(subject[0].getBoundingClientRect().top).to.be.closeTo(0, 30);
        });
    }
  );

  it.skip('Should scroll to report when clicking on a report in the timeline', () => {
    cy.visit(url);

    cy.disableSmoothScroll();

    cy.waitForStableDOM();

    cy.get('text').contains('For some Starbucks workers, job leaves bitter taste').parents('a');

    cy.get('h5')
      .contains('For some Starbucks workers, job leaves bitter taste')
      .parents('[data-cy="incident-report-card"]')
      .then((subject) => {
        expect(subject[0].getBoundingClientRect().top).to.be.closeTo(0, 1);
      });
  });

  // skipping until https://github.com/responsible-ai-collaborative/aiid/pull/1680/files is merged
  it.skip(
    'Should scroll to report when coming from the landing page',
    { retries: { runMode: 4 } },
    () => {
      cy.visit('/');

      cy.disableSmoothScroll();

      cy.waitForStableDOM();

      cy.get('[data-cy="latest-incident-report-title"]').then(($value) => {
        const incidentTitle = $value.text();

        cy.contains('Latest Incident Report').first().click();
        cy.waitForStableDOM();

        cy.contains('h5', incidentTitle, { timeout: 8000 })
          .parents('[data-cy="incident-report-card"]')
          .then((subject) => {
            expect(subject[0].getBoundingClientRect().top).to.be.closeTo(0, 30);
          });
      });
    }
  );

  it('Should show the incident stats table', () => {
    cy.visit(url);
    cy.get('[data-cy=incident-stats]').should('exist');
  });

  it('Should show editors in the stats table', () => {
    cy.visit(url);
    cy.get('[data-cy=incident-stats] > * > *')
      .contains('Editors')
      .parents('*')
      .contains('Sean McGregor');
  });

  it('Should flag an incident', () => {
    // mock requests until a testing database is implemented
    const _id = '23';

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindReport',
      'fetchReport',
      unflaggedReport
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'logReportHistory',
      'logReportHistory',
      {
        data: {
          logReportHistory: {
            report_number: 10,
          },
        },
      }
    );

    cy.visit(url + '#' + _id);

    cy.waitForStableDOM();

    cy.get(`[id="r${_id}"`).find('[data-cy="expand-report-button"]').click();

    cy.get(`[id="r${_id}"`).find('[data-cy="flag-button"]').click();

    cy.get('[data-cy="flag-report-23"]').as('modal').should('be.visible');

    cy.wait('@fetchReport');

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpdateReport',
      'updateReport',
      flaggedReport
    );

    const now = new Date();

    cy.clock(now);

    cy.get('@modal').find('[data-cy="flag-toggle"]').click();

    cy.wait('@updateReport')
      .its('request.body.variables')
      .then((variables) => {
        expect(variables.query.report_number).to.equal(23);
        expect(variables.set).deep.eq({
          flag: true,
          date_modified: format(now, 'yyyy-MM-dd'),
          epoch_date_modified: getUnixTime(now),
        });
      });

    cy.wait('@logReportHistory')
      .its('request.body.variables.input')
      .then((input) => {
        const expectedReport = deleteReportTypenames(
          transformReportData(flaggedReport.data.updateOneReport)
        );

        expectedReport.modifiedBy = '';
        expectedReport.date_modified = format(now, 'yyyy-MM-dd');
        expectedReport.epoch_date_modified = getUnixTime(now);

        expect(input).to.deep.eq(expectedReport);
      });

    cy.get('@modal').find('[data-cy="flag-toggle"]').should('be.disabled');

    cy.get('[aria-label="Close"]').click();

    cy.get('@modal').should('not.exist');
  });

  maybeIt('Should remove duplicate', () => {
    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpsertClassification',
      'upsertClassification',
      upsertDuplicateClassification
    );
    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpdateIncident',
      'updateIncident',
      updateIncident50
    );
    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'InsertDuplicate',
      'insertDuplicate',
      {
        data: {
          insertOneDuplicate: {
            __typename: 'Duplicate',
            duplicate_incident_number: 10,
            true_incident_number: 50,
          },
        },
      }
    );

    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));
    cy.waitForStableDOM();

    cy.visit('/cite/10');
    cy.waitForStableDOM();

    cy.get('[data-cy="remove-duplicate"]').click();
    cy.waitForStableDOM();

    cy.get('#input-duplicateIncidentId').type('50');
    cy.waitForStableDOM();

    cy.get('#duplicateIncidentId > a[aria-label="50"]').click();
    cy.waitForStableDOM();

    cy.get('[data-cy="confirm-remove-duplicate"]').click();
    cy.waitForStableDOM();

    cy.contains('Incident 10 marked as duplicate').should('exist');
  });

  it('Should pre-fill submit report form', () => {
    cy.visit(url);

    cy.contains('New Report').scrollIntoView().click();

    cy.waitForStableDOM();

    cy.contains('[data-cy="prefilled-incident-id"]', 'Adding a new report to incident 10').should(
      'be.visible'
    );

    cy.get(`.incident-ids-field [data-cy="token"]`).contains('10').should('be.visible');
  });

  it('Should pre-fill submit report response form', () => {
    cy.visit(url);

    cy.waitForStableDOM();

    cy.contains('New Response').scrollIntoView().click();

    cy.waitForStableDOM();

    cy.contains('[data-cy="prefilled-incident-id"]', 'Adding a new response to incident 10').should(
      'be.visible'
    );

    cy.get(`.incident-ids-field [data-cy="token"]`).contains('10').should('be.visible');
  });

  it('should render Next and Previous incident buttons', () => {
    cy.visit(url);

    cy.contains('Next Incident').should('be.visible').should('have.attr', 'href', '/cite/11');

    cy.contains('Previous Incident').should('be.visible').should('have.attr', 'href', '/cite/9');
  });

  maybeIt('Should show the edit incident form', () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    cy.visit(url);

    cy.waitForStableDOM();

    cy.contains('Edit Incident').click();

    cy.waitForStableDOM();

    cy.url().should('contain', '/incidents/edit/?incident_id=10');

    cy.waitForStableDOM();

    cy.get('[data-cy="incident-form"]', { timeout: 20000 }).should('be.visible');
  });

  it('Should display correct BibTex Citation', { retries: { runMode: 4 } }, () => {
    cy.visit(url);

    const date = format(new Date(), 'MMMMd,y');

    cy.waitForStableDOM();

    cy.contains('button', 'Citation Info').click();

    cy.waitForStableDOM();

    cy.get('[data-cy="citation-info-modal"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-cy="bibtex-format"]', { timeout: 15000 })
      .find('code')
      .invoke('text')
      .then((text) => {
        // would be nice not having to remove especial characters
        // eslint-disable-next-line
        const bibText = text.replace(/(\r\n|\n|\r| |\s)/g, '');

        expect(bibText).to.eq(
          `@article{aiid:10,author={Olsson,Catherine},editor={McGregor,Sean},journal={AIIncidentDatabase},publisher={ResponsibleAICollaborative},title={IncidentNumber10},url={https://incidentdatabase.ai/cite/10},year={2014},urldate={${date}}}`
        );
      });
  });

  it('Should display correct Citation', () => {
    cy.visit(url);

    const date = format(new Date(), 'MMMM d, y');

    cy.waitForStableDOM();

    cy.contains('button', 'Citation Info').click();

    cy.waitForStableDOM();

    cy.get('[data-cy="suggested-citation-format"]').should(
      'contain.text',
      `Olsson, Catherine. (2014-08-14) Incident Number 10. in McGregor, S. (ed.) Artificial Intelligence Incident Database. Responsible AI Collaborative. Retrieved on ${date} from incidentdatabase.ai/cite/10.`
    );
  });

  it('Should display similar incidents', () => {
    cy.visit('/cite/9');

    cy.get('[data-cy="similar-incident-card"]').should('exist');
  });

  it('Should display similar incidents with localized links', () => {
    cy.visit('/es/cite/9');

    cy.get('[data-cy="similar-incident-card"]').should('exist');

    cy.get('.tw-main-container [data-cy="similar-incident-card"] > [data-cy="cite-link"]').each(
      (link) => {
        const href = link[0].href;

        expect(href).to.contains('/es/cite/');
      }
    );
  });

  it('Should not display duplicate similar incidents', () => {
    cy.visit('/cite/9');

    const hrefs = new Set();

    cy.get('.tw-main-container [data-cy="similar-incident-card"] > [data-cy="cite-link"]').each(
      (link) => {
        const href = link[0].href;

        expect(hrefs.has(href)).to.be.false;
        hrefs.add(href);
      }
    );
  });

  it('Should not display edit link when not logged in', () => {
    cy.visit('/cite/9');

    cy.get('[data-cy="edit-similar-incidents"]').should('not.exist');
  });

  maybeIt('Should display edit link when logged in as editor', () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    cy.visit('/cite/9');

    cy.get('[data-cy="edit-similar-incidents"]').should('exist');
  });

  it('Should flag an incident as not related (not authenticated)', () => {
    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncident',
      'findIncident',
      incident10
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpdateIncident',
      'updateIncident',
      updateOneIncidentFlagged
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'logIncidentHistory',
      'logIncidentHistory',
      {
        data: {
          logIncidentHistory: {
            incident_id: 9,
          },
        },
      }
    );

    cy.visit('/cite/9');

    cy.wait('@findIncident', { timeout: 30000 });

    cy.waitForStableDOM();

    const now = new Date();

    cy.clock(now);

    cy.get('[data-cy="flag-similar-incident"]').first().click();

    cy.wait('@updateIncident', { timeout: 8000 }).then((xhr) => {
      expect(xhr.request.body.variables.query).deep.eq({ incident_id: 9 });
      expect(xhr.request.body.variables.set).to.deep.eq({
        flagged_dissimilar_incidents: [11],
        epoch_date_modified: getUnixTime(now),
        editors: { link: incident10.data.incident.editors.map((e) => e.userId) },
      });
    });

    cy.wait('@logIncidentHistory')
      .its('request.body.variables.input')
      .then((input) => {
        const expectedIncident = deleteIncidentTypenames(
          transformIncidentData(incident10.data.incident)
        );

        expectedIncident.flagged_dissimilar_incidents = [11];
        expectedIncident.epoch_date_modified = getUnixTime(now);
        expectedIncident.modifiedBy = '';

        expect(input).to.deep.eq(expectedIncident);
      });
  });

  maybeIt('Should flag an incident as not related (authenticated)', () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'FindIncident',
      'findIncident',
      incident10
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpdateIncident',
      'updateIncident',
      updateOneIncidentFlagged
    );

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'logIncidentHistory',
      'logIncidentHistory',
      {
        data: {
          logIncidentHistory: {
            incident_id: 9,
          },
        },
      }
    );

    cy.visit('/cite/9');

    cy.wait('@findIncident', { timeout: 10000 });

    cy.waitForStableDOM();

    const now = new Date();

    cy.clock(now);

    cy.get('[data-cy="flag-similar-incident"]').first().click();

    cy.wait('@updateIncident', { timeout: 8000 }).then((xhr) => {
      expect(xhr.request.body.variables.query).deep.eq({ incident_id: 9 });
      expect(xhr.request.body.variables.set).to.deep.eq({
        flagged_dissimilar_incidents: [],
        epoch_date_modified: getUnixTime(now),
        editors: { link: [...incident10.data.incident.editors.map((e) => e.userId), user.userId] },
      });
    });

    cy.wait('@logIncidentHistory')
      .its('request.body.variables.input')
      .then((input) => {
        const expectedIncident = deleteIncidentTypenames(
          transformIncidentData(incident10.data.incident)
        );

        expectedIncident.flagged_dissimilar_incidents = [];
        expectedIncident.epoch_date_modified = getUnixTime(now);
        expectedIncident.modifiedBy = user.userId;
        expectedIncident.editors = [
          ...incident10.data.incident.editors.map((e) => e.userId),
          user.userId,
        ];

        expect(input).to.deep.eq(expectedIncident);
      });
  });

  it('Should have OpenGraph meta tags', () => {
    cy.visit(url);

    cy.query({
      query: gql`
        query {
          incidents(query: { incident_id: ${incidentId} }, limit: 1) {
            title
            description
            reports {
              image_url
              date_published
            }
          }
        }
      `,
    }).then(({ data: { incidents } }) => {
      const incident = incidents[0];

      const title = `Incident ${incidentId}: ${incident.title}`;

      const description = incident.description;

      cy.get('head meta[name="title"]').should('have.attr', 'content', title);
      cy.get('head meta[name="description"]').should('have.attr', 'content', description);

      cy.get('head meta[name="twitter:site"]').should('have.attr', 'content', '@IncidentsDB');
      cy.get('head meta[name="twitter:creator"]').should('have.attr', 'content', '@IncidentsDB');

      cy.get('head meta[property="og:url"]').should(
        'have.attr',
        'content',
        `https://incidentdatabase.ai${url}/`
      );
      cy.get('head meta[property="og:type"]').should('have.attr', 'content', 'website');
      cy.get('head meta[property="og:title"]').should('have.attr', 'content', title);
      cy.get('head meta[property="og:description"]').should('have.attr', 'content', description);
      cy.get('head meta[property="og:image"]').first().should('have.attr', 'content');
      cy.get('head meta[property="twitter:title"]').should('have.attr', 'content', title);
      cy.get('head meta[property="twitter:description"]').should(
        'have.attr',
        'content',
        description
      );
      cy.get('head meta[property="twitter:image"]').should('have.attr', 'content');
    });
  });

  maybeIt('Should subscribe to incident updates (user authenticated)', () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    cy.visit('/cite/51');

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpsertSubscription',
      'upsertSubscription',
      {
        data: {
          upsertOneSubscription: {
            _id: 'dummyIncidentId',
          },
        },
      }
    );

    cy.waitForStableDOM();

    cy.contains('Notify Me of Updates').scrollIntoView().click();

    cy.get('[data-cy="toast"]', { timeout: 15000 }).should('be.visible');

    cy.contains(
      '[data-cy="toast"]',
      `You have successfully subscribed to updates on incident 51`
    ).should('be.visible');
  });

  it('Should not subscribe to incident updates (user unauthenticated)', () => {
    cy.visit(url);

    cy.conditionalIntercept(
      '**/graphql',
      (req) => req.body.operationName == 'UpsertSubscription',
      'upsertSubscription',
      {
        data: {
          upsertOneSubscription: {
            _id: 'dummyIncidentId',
          },
        },
      }
    );

    cy.waitForStableDOM();

    cy.contains('Notify Me of Updates').scrollIntoView().click();

    cy.get('[data-cy="toast"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-cy="toast"]').contains(`Please log in to subscribe`).should('be.visible');
  });

  it('Should show proper entities card text', () => {
    cy.visit('/cite/67/');

    cy.get('[data-cy="alleged-entities"]').should(
      'have.text',
      'Alleged: Tesla developed an AI system deployed by Tesla and Motorist, which harmed Motorists.'
    );

    cy.visit('/cite/72/');

    cy.get('[data-cy="alleged-entities"]').should(
      'have.text',
      'Alleged: Facebook developed and deployed an AI system, which harmed unnamed Palestinian Facebook user , Palestinian Facebook users , Arabic-speaking Facebook users and Facebook users.'
    );

    cy.visit('/cite/30');

    cy.get('[data-cy="alleged-entities"]').should(
      'have.text',
      'Alleged: Tesla developed and deployed an AI system, which harmed Tesla.'
    );
  });

  it('Should display response in timeline and as badge', () => {
    cy.visit('/cite/51#r1765');

    cy.get('#r1765')
      .scrollIntoView()
      .contains('post-incident response', { timeout: 8000 })
      .should('exist');

    cy.get('[data-cy="responded-badge"]').should('exist');

    cy.get('[data-cy="timeline-text-response"]').should('exist');
  });

  it('Should not display response in timeline or in badge', () => {
    cy.visit('/cite/1');

    cy.get('[data-cy="responded-badge"]').should('not.exist');

    cy.get('[data-cy="timeline-text-response"]').should('not.exist');
  });

  it('There should not be image errors (400)', () => {
    cy.visit(url, {
      onBeforeLoad(win) {
        cy.stub(win.console, 'error').as('consoleError');
      },
    });

    cy.waitForStableDOM();

    cy.get('@consoleError').then((consoleError) => {
      const noImagesErrors = consoleError
        .getCalls()
        .every((call) =>
          call.args.every(
            (arg) => !(arg.includes('https://res.cloudinary.com') && arg.includes('400'))
          )
        );

      expect(noImagesErrors, 'No images errors').to.be.true;
    });
  });

  it('Should not display edit link when not logged in', () => {
    cy.visit(url);

    cy.get('[data-cy="clone-incident-btn"]').should('not.exist');
  });

  maybeIt('Should clone incident opening the preloaded new Incident form', () => {
    cy.login(Cypress.env('e2eUsername'), Cypress.env('e2ePassword'));

    cy.visit(url);

    cy.contains('Clone Incident').click();

    cy.waitForStableDOM();

    cy.url().should('contain', `/incidents/new/?incident_id=${incidentId}`);

    cy.get('[data-cy="incident-form"]', { timeout: 8000 }).should('be.visible');
  });

  it('Should open incident from the discover app', { retries: { runMode: 4 } }, () => {
    cy.visit(discoverUrl);

    cy.disableSmoothScroll();

    cy.waitForStableDOM();

    cy.get('[data-cy="collapse-button"]:visible').click();

    cy.contains('Show Details on Incident #10').first().click();

    cy.waitForStableDOM();

    cy.url().should('include', '/cite/10');

    cy.waitForStableDOM();
  });
});
