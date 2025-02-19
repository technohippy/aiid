const { SUBSCRIPTION_TYPE } = require('../../../../src/utils/subscriptions');

const promoteSubmissionToReport = require('../../../../../realm/functions/promoteSubmissionToReport');

//should be on its own /cypress/unit folder or something

const submission = {
  _id: '5f9c3ebfd4896d392493f03c',
  authors: ['Nedi Bedi and Kathleen McGrory'],
  cloudinary_id: 'something',
  date_downloaded: '2020-10-30',
  date_modified: '2021-07-27',
  date_published: '2017-05-03',
  date_submitted: '2020-10-30',
  epoch_date_modified: 1686182943,
  description:
    'By NEIL BEDI and KATHLEEN McGRORY\nTimes staff writers\nNov. 19, 2020\nThe Pasco Sheriff’s Office keeps a secret list of kids it thinks could “fall into a life of crime” based on factors like wheth',
  image_url: 'https://s3.amazonaws.com/ledejs/resized/s2020-pasco-ilp/600/nocco5.jpg',
  incident_date: '2015-09-01',
  incident_editors: ['1', '2'],
  incident_id: 0,
  language: 'en',
  source_domain: 'projects.tampabay.com',
  submitters: ['Kate Perkins'],
  text: '## Submission 1 text\n\n_Markdown content!_',
  plain_text: 'Submission 1 text\n\nMarkdown content!',
  title: 'Submisssion 1 title',
  url: 'https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/',
  editor_notes: '',
  developers: ['AI Dev'],
  deployers: ['Youtube'],
  harmed_parties: ['Adults'],
  nlp_similar_incidents: [],
  editor_dissimilar_incidents: [],
  editor_similar_incidents: [],
  tags: [],
  user: 'user1',
};

const submission_with_embedding = {
  _id: '5f9c3ebfd4896d392493f03c',
  authors: ['Nedi Bedi and Kathleen McGrory'],
  cloudinary_id: 'something',
  date_downloaded: '2020-10-30',
  date_modified: '2021-07-27',
  date_published: '2017-05-03',
  date_submitted: '2020-10-30',
  epoch_date_modified: 1686182943,
  description:
    'By NEIL BEDI and KATHLEEN McGRORY\nTimes staff writers\nNov. 19, 2020\nThe Pasco Sheriff’s Office keeps a secret list of kids it thinks could “fall into a life of crime” based on factors like wheth',
  image_url: 'https://s3.amazonaws.com/ledejs/resized/s2020-pasco-ilp/600/nocco5.jpg',
  incident_date: '2015-09-01',
  incident_editors: ['1', '2'],
  incident_id: 0,
  language: 'en',
  source_domain: 'projects.tampabay.com',
  submitters: ['Kate Perkins'],
  text: '## Submission 1 text\n\n_Markdown content!_',
  plain_text: 'Submission 1 text\n\nMarkdown content!',
  title: 'Submisssion 1 title',
  url: 'https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/',
  editor_notes: '',
  developers: ['AI Dev'],
  deployers: ['Youtube'],
  harmed_parties: ['Adults'],
  nlp_similar_incidents: [],
  editor_dissimilar_incidents: [],
  editor_similar_incidents: [],
  tags: [],
  user: 'user1',
  embedding: {
    vector: [1, 2, 3],
    from_reports: [1],
  },
};

const incident = {
  AllegedDeployerOfAISystem: [],
  AllegedDeveloperOfAISystem: [],
  AllegedHarmedOrNearlyHarmedParties: [],
  __typename: 'Incident',
  date: '2018-11-16',
  description:
    'Twenty-four Amazon workers in New Jersey were hospitalized after a robot punctured a can of bear repellent spray in a warehouse.',
  editors: ['1', '2'],
  incident_id: 1,
  nlp_similar_incidents: [],
  reports: [1, 2],
  title: '24 Amazon workers sent to hospital after robot accidentally unleashes bear spray',
};

describe('Functions', () => {
  it('Should promote a submission to a new report & new incident', () => {
    const submissionsCollection = {
      findOne: cy.stub().resolves(submission),
      deleteOne: cy.stub(),
    };

    const incidentsCollection = {
      find: cy
        .stub()
        .onFirstCall()
        .returns({
          toArray: cy.stub().resolves([]),
        })
        .onSecondCall()
        .returns({
          sort: cy.stub().returns({
            limit: cy.stub().returns({
              next: cy.stub().resolves(incident),
            }),
          }),
        }),
      insertOne: cy.stub().resolves(),
    };

    const incidentsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsCollection = {
      find: cy.stub().returns({
        sort: cy.stub().returns({
          limit: cy.stub().returns({
            next: cy.stub().resolves({ report_number: 1 }),
          }),
        }),
      }),
      insertOne: cy.stub().resolves(),
    };

    const notificationsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const subscriptionsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    global.context = {
      // @ts-ignore
      services: {
        get: cy.stub().returns({
          db: (() => {
            const stub = cy.stub();

            stub.withArgs('aiidprod').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('submissions').returns(submissionsCollection);
                stub.withArgs('incidents').returns(incidentsCollection);
                stub.withArgs('reports').returns(reportsCollection);

                return stub;
              })(),
            });

            stub.withArgs('customData').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('notifications').returns(notificationsCollection);
                stub.withArgs('subscriptions').returns(subscriptionsCollection);

                return stub;
              })(),
            });

            stub.withArgs('history').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('incidents').returns(incidentsHistoryCollection);
                stub.withArgs('reports').returns(reportsHistoryCollection);

                return stub;
              })(),
            });

            return stub;
          })(),
        }),
      },
      functions: {
        execute: cy.stub(),
      },
    };

    global.BSON = { Int32: (x) => x };

    cy.wrap(
      promoteSubmissionToReport({ is_incident_report: true, incident_ids: [], submission_id: 1 })
    ).then(() => {
      const expectedIncident = {
        'Alleged deployer of AI system': ['Youtube'],
        'Alleged developer of AI system': ['AI Dev'],
        'Alleged harmed or nearly harmed parties': ['Adults'],
        date: '2015-09-01',
        epoch_date_modified: 1686182943,
        description:
          'By NEIL BEDI and KATHLEEN McGRORY\nTimes staff writers\nNov. 19, 2020\nThe Pasco Sheriff’s Office keeps a secret list of kids it thinks could “fall into a life of crime” based on factors like wheth',
        editor_dissimilar_incidents: [],
        editor_similar_incidents: [],
        editors: ['1', '2'],
        incident_id: 2,
        nlp_similar_incidents: [],
        reports: [],
        title: 'Submisssion 1 title',
      };

      expect(incidentsCollection.insertOne.firstCall.args[0]).to.deep.equal(expectedIncident);

      expect(incidentsHistoryCollection.insertOne.firstCall.args[0]).to.deep.equal({
        ...expectedIncident,
        reports: [2],
        modifiedBy: submission.user,
      });

      const expectedReport = {
        report_number: 2,
        is_incident_report: true,
        title: 'Submisssion 1 title',
        date_downloaded: new Date('2020-10-30'),
        date_modified: new Date('2021-07-27'),
        date_published: new Date('2017-05-03'),
        date_submitted: new Date('2020-10-30'),
        epoch_date_downloaded: 1604016000,
        epoch_date_modified: 1686182943,
        epoch_date_published: 1493769600,
        epoch_date_submitted: 1604016000,
        image_url: 'https://s3.amazonaws.com/ledejs/resized/s2020-pasco-ilp/600/nocco5.jpg',
        cloudinary_id: 'something',
        authors: ['Nedi Bedi and Kathleen McGrory'],
        submitters: ['Kate Perkins'],
        text: '## Submission 1 text\n\n_Markdown content!_',
        plain_text: 'Submission 1 text\n\nMarkdown content!',
        url: 'https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/',
        source_domain: 'projects.tampabay.com',
        language: 'en',
        tags: [],
        user: 'user1',
      };

      expect(reportsCollection.insertOne.firstCall.args[0]).to.deep.eq(expectedReport);

      expect(submissionsCollection.deleteOne).to.be.calledOnceWith({ _id: 1 });

      expect(global.context.functions.execute).to.be.calledOnceWith('linkReportsToIncidents', {
        incident_ids: [2],
        report_numbers: [2],
      });

      expect(reportsHistoryCollection.insertOne.firstCall.args[0]).to.deep.eq({
        ...expectedReport,
        modifiedBy: submission.user,
      });

      expect(notificationsCollection.insertOne.firstCall.args[0]).to.deep.equal({
        type: SUBSCRIPTION_TYPE.submissionPromoted,
        incident_id: 2,
        userId: 'user1',
        processed: false,
      });
    });
  });

  it('Should promote a submission to a new report & existing incident', () => {
    const submissionsCollection = {
      findOne: cy.stub().resolves(submission_with_embedding),
      deleteOne: cy.stub(),
    };

    const incidentsCollection = {
      find: cy
        .stub()
        .onFirstCall()
        .returns({
          toArray: cy.stub().resolves([incident]),
        })
        .onSecondCall()
        .returns({
          sort: cy.stub().returns({
            limit: cy.stub().returns({
              next: cy.stub().resolves(incident),
            }),
          }),
        }),
      insertOne: cy.stub().resolves(),
      updateOne: cy.stub().resolves(),
    };

    const incidentsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsCollection = {
      find: cy.stub().returns({
        sort: cy.stub().returns({
          limit: cy.stub().returns({
            next: cy.stub().resolves({ report_number: 1 }),
          }),
        }),
      }),
      findOne: cy.stub().resolves({ report_number: 1 }),
      insertOne: cy.stub().resolves(),
    };

    const reportsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const notificationsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const subscriptionsCollection = {
      insertOne: cy.stub().resolves(),
    };

    global.context = {
      // @ts-ignore
      services: {
        get: cy.stub().returns({
          db: (() => {
            const stub = cy.stub();

            stub.withArgs('aiidprod').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('submissions').returns(submissionsCollection);
                stub.withArgs('incidents').returns(incidentsCollection);
                stub.withArgs('reports').returns(reportsCollection);

                return stub;
              })(),
            });

            stub.withArgs('customData').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('notifications').returns(notificationsCollection);
                stub.withArgs('subscriptions').returns(subscriptionsCollection);

                return stub;
              })(),
            });

            stub.withArgs('history').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('incidents').returns(incidentsHistoryCollection);
                stub.withArgs('reports').returns(reportsHistoryCollection);

                return stub;
              })(),
            });

            return stub;
          })(),
        }),
      },
      functions: {
        execute: cy.stub(),
      },
    };

    global.BSON = { Int32: (x) => x };

    cy.wrap(
      promoteSubmissionToReport({ is_incident_report: true, incident_ids: [1], submission_id: 1 })
    ).then(() => {
      expect(incidentsCollection.insertOne.callCount).to.eq(0);

      expect(incidentsHistoryCollection.insertOne.callCount).to.eq(1);

      const expectedReport = {
        report_number: 2,
        is_incident_report: true,
        title: 'Submisssion 1 title',
        date_downloaded: new Date('2020-10-30'),
        date_modified: new Date('2021-07-27'),
        date_published: new Date('2017-05-03'),
        date_submitted: new Date('2020-10-30'),
        epoch_date_downloaded: 1604016000,
        epoch_date_modified: 1686182943,
        epoch_date_published: 1493769600,
        epoch_date_submitted: 1604016000,
        image_url: 'https://s3.amazonaws.com/ledejs/resized/s2020-pasco-ilp/600/nocco5.jpg',
        cloudinary_id: 'something',
        authors: ['Nedi Bedi and Kathleen McGrory'],
        submitters: ['Kate Perkins'],
        text: '## Submission 1 text\n\n_Markdown content!_',
        plain_text: 'Submission 1 text\n\nMarkdown content!',
        url: 'https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/',
        source_domain: 'projects.tampabay.com',
        language: 'en',
        tags: [],
        user: 'user1',
        embedding: {
          vector: [1, 2, 3],
          from_reports: [1],
        },
      };

      expect(reportsCollection.insertOne.firstCall.args[0]).to.deep.eq(expectedReport);

      expect(submissionsCollection.deleteOne).to.be.calledOnceWith({ _id: 1 });

      expect(global.context.functions.execute).to.be.calledOnceWith('linkReportsToIncidents', {
        incident_ids: [1],
        report_numbers: [2],
      });

      expect(reportsHistoryCollection.insertOne.firstCall.args[0]).to.deep.eq({
        ...expectedReport,
        modifiedBy: submission_with_embedding.user,
      });

      expect(subscriptionsCollection.insertOne.called).to.be.false;
    });
  });

  it('Should promote a submission to a new issue', () => {
    const submissionsCollection = {
      findOne: cy.stub().resolves(submission),
      deleteOne: cy.stub(),
    };

    const incidentsCollection = {
      find: cy
        .stub()
        .onFirstCall()
        .returns({
          toArray: cy.stub().resolves([]),
        })
        .onSecondCall()
        .returns({
          sort: cy.stub().returns({
            limit: cy.stub().returns({
              next: cy.stub().resolves(incident),
            }),
          }),
        }),
      insertOne: cy.stub().resolves(),
    };

    const incidentsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsCollection = {
      find: cy.stub().returns({
        sort: cy.stub().returns({
          limit: cy.stub().returns({
            next: cy.stub().resolves({ report_number: 1 }),
          }),
        }),
      }),
      insertOne: cy.stub().resolves(),
    };

    const reportsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const notificationsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const subscriptionsCollection = {
      insertOne: cy.stub().resolves(),
    };

    global.context = {
      // @ts-ignore
      services: {
        get: cy.stub().returns({
          db: (() => {
            const stub = cy.stub();

            stub.withArgs('aiidprod').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('submissions').returns(submissionsCollection);
                stub.withArgs('incidents').returns(incidentsCollection);
                stub.withArgs('reports').returns(reportsCollection);

                return stub;
              })(),
            });

            stub.withArgs('customData').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('notifications').returns(notificationsCollection);
                stub.withArgs('subscriptions').returns(subscriptionsCollection);

                return stub;
              })(),
            });

            stub.withArgs('history').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('incidents').returns(incidentsHistoryCollection);
                stub.withArgs('reports').returns(reportsHistoryCollection);

                return stub;
              })(),
            });

            return stub;
          })(),
        }),
      },
      functions: {
        execute: cy.stub(),
      },
    };

    global.BSON = { Int32: (x) => x };

    cy.wrap(
      promoteSubmissionToReport({ is_incident_report: false, incident_ids: [], submission_id: 1 })
    ).then(() => {
      expect(incidentsCollection.insertOne.callCount).to.equal(0);

      expect(incidentsHistoryCollection.insertOne.callCount).to.equal(0);

      const expectedReport = {
        report_number: 2,
        is_incident_report: false,
        title: 'Submisssion 1 title',
        date_downloaded: new Date('2020-10-30'),
        date_modified: new Date('2021-07-27'),
        date_published: new Date('2017-05-03'),
        date_submitted: new Date('2020-10-30'),
        epoch_date_downloaded: 1604016000,
        epoch_date_modified: 1686182943,
        epoch_date_published: 1493769600,
        epoch_date_submitted: 1604016000,
        image_url: 'https://s3.amazonaws.com/ledejs/resized/s2020-pasco-ilp/600/nocco5.jpg',
        cloudinary_id: 'something',
        authors: ['Nedi Bedi and Kathleen McGrory'],
        submitters: ['Kate Perkins'],
        text: '## Submission 1 text\n\n_Markdown content!_',
        plain_text: 'Submission 1 text\n\nMarkdown content!',
        url: 'https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/',
        source_domain: 'projects.tampabay.com',
        language: 'en',
        tags: [],
        user: 'user1',
      };

      expect(reportsCollection.insertOne.firstCall.args[0]).to.deep.eq(expectedReport);

      expect(submissionsCollection.deleteOne).to.be.calledOnceWith({ _id: 1 });

      expect(global.context.functions.execute).to.be.calledOnceWith('linkReportsToIncidents', {
        incident_ids: [],
        report_numbers: [2],
      });

      expect(reportsHistoryCollection.insertOne.firstCall.args[0]).to.deep.eq({
        ...expectedReport,
        modifiedBy: submission.user,
      });

      expect(subscriptionsCollection.insertOne.called).to.be.false;
    });
  });

  it("Should default to Anonymous's user id", () => {
    const submissionsCollection = {
      findOne: cy.stub().resolves({ ...submission, incident_editors: [] }),
      deleteOne: cy.stub(),
    };

    const incidentsCollection = {
      find: cy
        .stub()
        .onFirstCall()
        .returns({
          toArray: cy.stub().resolves([]),
        })
        .onSecondCall()
        .returns({
          sort: cy.stub().returns({
            limit: cy.stub().returns({
              next: cy.stub().resolves(incident),
            }),
          }),
        }),
      insertOne: cy.stub().resolves(),
    };

    const reportsCollection = {
      find: cy.stub().returns({
        sort: cy.stub().returns({
          limit: cy.stub().returns({
            next: cy.stub().resolves({ report_number: 1 }),
          }),
        }),
      }),
      insertOne: cy.stub().resolves(),
    };

    const notificationsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const subscriptionsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const incidentsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    global.context = {
      // @ts-ignore
      services: {
        get: cy.stub().returns({
          db: (() => {
            const stub = cy.stub();

            stub.withArgs('aiidprod').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('submissions').returns(submissionsCollection);
                stub.withArgs('incidents').returns(incidentsCollection);
                stub.withArgs('reports').returns(reportsCollection);

                return stub;
              })(),
            });

            stub.withArgs('customData').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('notifications').returns(notificationsCollection);
                stub.withArgs('subscriptions').returns(subscriptionsCollection);

                return stub;
              })(),
            });

            stub.withArgs('history').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('incidents').returns(incidentsHistoryCollection);
                stub.withArgs('reports').returns(reportsHistoryCollection);

                return stub;
              })(),
            });

            return stub;
          })(),
        }),
      },
      functions: {
        execute: cy.stub(),
      },
    };

    global.BSON = { Int32: (x) => x };

    cy.wrap(
      promoteSubmissionToReport({ is_incident_report: true, incident_ids: [], submission_id: 1 })
    ).then(() => {
      expect(incidentsCollection.insertOne.firstCall.args[0]).to.deep.equal({
        'Alleged deployer of AI system': ['Youtube'],
        'Alleged developer of AI system': ['AI Dev'],
        'Alleged harmed or nearly harmed parties': ['Adults'],
        date: '2015-09-01',
        epoch_date_modified: 1686182943,
        description:
          'By NEIL BEDI and KATHLEEN McGRORY\nTimes staff writers\nNov. 19, 2020\nThe Pasco Sheriff’s Office keeps a secret list of kids it thinks could “fall into a life of crime” based on factors like wheth',
        editor_dissimilar_incidents: [],
        editor_similar_incidents: [],
        editors: ['65031f49ec066d7c64380f5c'], // Default user. For more information refer to the wiki page: https://github.com/responsible-ai-collaborative/aiid/wiki/Special-non%E2%80%90secret-values
        incident_id: 2,
        nlp_similar_incidents: [],
        reports: [],
        title: 'Submisssion 1 title',
      });
    });
  });

  it('Should promote a submission submitted by an anonymous user', () => {
    const anonymousSubmission = submission;

    delete anonymousSubmission.user;

    const submissionsCollection = {
      findOne: cy.stub().resolves(submission),
      deleteOne: cy.stub(),
    };

    const incidentsCollection = {
      find: cy
        .stub()
        .onFirstCall()
        .returns({
          toArray: cy.stub().resolves([]),
        })
        .onSecondCall()
        .returns({
          sort: cy.stub().returns({
            limit: cy.stub().returns({
              next: cy.stub().resolves(incident),
            }),
          }),
        }),
      insertOne: cy.stub().resolves(),
    };

    const incidentsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsCollection = {
      find: cy.stub().returns({
        sort: cy.stub().returns({
          limit: cy.stub().returns({
            next: cy.stub().resolves({ report_number: 1 }),
          }),
        }),
      }),
      insertOne: cy.stub().resolves(),
    };

    const notificationsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const subscriptionsCollection = {
      insertOne: cy.stub().resolves(),
    };

    const reportsHistoryCollection = {
      insertOne: cy.stub().resolves(),
    };

    global.context = {
      // @ts-ignore
      services: {
        get: cy.stub().returns({
          db: (() => {
            const stub = cy.stub();

            stub.withArgs('aiidprod').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('submissions').returns(submissionsCollection);
                stub.withArgs('incidents').returns(incidentsCollection);
                stub.withArgs('reports').returns(reportsCollection);

                return stub;
              })(),
            });

            stub.withArgs('customData').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('notifications').returns(notificationsCollection);
                stub.withArgs('subscriptions').returns(subscriptionsCollection);

                return stub;
              })(),
            });

            stub.withArgs('history').returns({
              collection: (() => {
                const stub = cy.stub();

                stub.withArgs('incidents').returns(incidentsHistoryCollection);
                stub.withArgs('reports').returns(reportsHistoryCollection);

                return stub;
              })(),
            });

            return stub;
          })(),
        }),
      },
      functions: {
        execute: cy.stub(),
      },
    };

    global.BSON = { Int32: (x) => x };

    cy.wrap(
      promoteSubmissionToReport({ is_incident_report: true, incident_ids: [], submission_id: 1 })
    ).then(() => {
      const expectedIncident = {
        'Alleged deployer of AI system': ['Youtube'],
        'Alleged developer of AI system': ['AI Dev'],
        'Alleged harmed or nearly harmed parties': ['Adults'],
        date: '2015-09-01',
        epoch_date_modified: 1686182943,
        description:
          'By NEIL BEDI and KATHLEEN McGRORY\nTimes staff writers\nNov. 19, 2020\nThe Pasco Sheriff’s Office keeps a secret list of kids it thinks could “fall into a life of crime” based on factors like wheth',
        editor_dissimilar_incidents: [],
        editor_similar_incidents: [],
        editors: ['1', '2'],
        incident_id: 2,
        nlp_similar_incidents: [],
        reports: [],
        title: 'Submisssion 1 title',
      };

      expect(incidentsCollection.insertOne.firstCall.args[0]).to.deep.equal(expectedIncident);

      expect(incidentsHistoryCollection.insertOne.firstCall.args[0]).to.deep.equal({
        ...expectedIncident,
        reports: [2],
      });

      const expectedReport = {
        report_number: 2,
        is_incident_report: true,
        title: 'Submisssion 1 title',
        date_downloaded: new Date('2020-10-30'),
        date_modified: new Date('2021-07-27'),
        date_published: new Date('2017-05-03'),
        date_submitted: new Date('2020-10-30'),
        epoch_date_downloaded: 1604016000,
        epoch_date_modified: 1686182943,
        epoch_date_published: 1493769600,
        epoch_date_submitted: 1604016000,
        image_url: 'https://s3.amazonaws.com/ledejs/resized/s2020-pasco-ilp/600/nocco5.jpg',
        cloudinary_id: 'something',
        authors: ['Nedi Bedi and Kathleen McGrory'],
        submitters: ['Kate Perkins'],
        text: '## Submission 1 text\n\n_Markdown content!_',
        plain_text: 'Submission 1 text\n\nMarkdown content!',
        url: 'https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/',
        source_domain: 'projects.tampabay.com',
        language: 'en',
        tags: [],
      };

      expect(reportsCollection.insertOne.firstCall.args[0]).to.deep.eq(expectedReport);

      expect(submissionsCollection.deleteOne).to.be.calledOnceWith({ _id: 1 });

      expect(global.context.functions.execute).to.be.calledOnceWith('linkReportsToIncidents', {
        incident_ids: [2],
        report_numbers: [2],
      });

      expect(reportsHistoryCollection.insertOne.firstCall.args[0]).to.deep.eq({
        ...expectedReport,
      });
    });
  });
});
