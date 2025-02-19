const { ObjectID } = require('bson');

const AlgoliaUpdater = require('../../../src/utils/AlgoliaUpdater');

const incidents = [
  {
    incident_id: 1,
    date: '2020-06-14',
    reports: [1, 23],
  },
];

const reports = [
  {
    _id: new ObjectID('60dd465f80935bc89e6f9b01'),
    authors: ['Alistair Barr'],
    date_downloaded: '2019-04-13',
    date_modified: '2020-06-14',
    date_published: '2015-05-19',
    date_submitted: '2019-06-01',
    description: 'Description of report 1',
    epoch_date_downloaded: 1555113600,
    epoch_date_modified: 1592092800,
    epoch_date_published: 1431993600,
    epoch_date_submitted: 1559347200,
    image_url: 'http://url.com',
    cloudinary_id: 'http://cloudinary.com',
    language: 'en',
    report_number: 1,
    source_domain: 'blogs.wsj.com',
    submitters: ['Roman Yampolskiy'],
    tags: [],
    text: 'Report 1 **text**',
    plain_text: 'Report 1 text',
    title: 'Report 1 title',
    url: 'https://url.com/stuff',
  },
  {
    _id: new ObjectID('60dd465f80935bc89e6f9b02'),
    authors: ['Alistair Barr'],
    date_downloaded: '2019-04-13',
    date_modified: '2020-06-14',
    date_published: '2015-05-19',
    date_submitted: '2019-06-01',
    description: 'Description of report 23',
    epoch_date_downloaded: 1555113600,
    epoch_date_modified: 1592092800,
    epoch_date_published: 1431993600,
    epoch_date_submitted: 1559347200,
    image_url: 'http://url.com',
    cloudinary_id: 'http://cloudinary.com',
    language: 'es',
    report_number: 23,
    source_domain: 'blogs.wsj.com',
    submitters: ['Roman Yampolskiy'],
    tags: [],
    text: 'Report 23 **text**',
    plain_text: 'Report 23 text',
    title: 'Report 23 title',
    url: 'https://url.com/stuff',
  },

  // this report hast no parent incidents
  {
    _id: new ObjectID('60dd465f80935bc89e6f9b07'),
    authors: ['Test User'],
    date_downloaded: '2019-04-13',
    date_modified: '2020-06-14',
    date_published: '2015-05-19',
    date_submitted: '2019-06-01',
    description: 'Description of report 40',
    epoch_date_downloaded: 1555113600,
    epoch_date_modified: 1592092800,
    epoch_date_published: 1431993600,
    epoch_date_submitted: 1559347200,
    image_url: 'http://url.com',
    cloudinary_id: 'http://cloudinary.com',
    language: 'es',
    report_number: 40,
    source_domain: 'blogs.wsj.com',
    submitters: ['Roman Yampolskiy'],
    tags: [],
    text: 'Report 40 **text**',
    plain_text: 'Report 40 text',
    title: 'Report 40 title',
    url: 'https://url.com/stuff',
  },
];

const classifications = [
  {
    _id: '60dd465f80935bc89e6f9b00',
    incidents: [1],
    reports: [],
    namespace: 'CSETv0',
    attributes: [
      { short_name: 'Named Entities', value_json: '["Amazon"]' },
      {
        short_name: 'Harm Type',
        value_json: '["Harm to physical health/safety", "Harm to physical property"]',
      },
      { short_name: 'Publish', value_json: 'true' },
    ],
    notes: null,
  },
  {
    _id: '60dd465f80935bc89e6f9b01',
    incidents: [],
    reports: [],
    namespace: 'SHOULD NOT BE INCLUDED',
    attributes: [{ short_name: 'Something', value_json: '"Great"' }],
    notes: 'Nothing to see here',
  },
];

const duplicates = [
  {
    duplicate_incident_number: 247,
    true_incident_number: 246,
  },
];

describe('Algolia', () => {
  it('Should update translations to Algolia', () => {
    const translatedReportsEN = [
      {
        _id: '61d5ad9f102e6e30fca9065r',
        text: 'translated-en-text **report 23**',
        plain_text: 'translated-en-text report 23',
        title: 'translated-en-title report 23',
        report_number: 23,
      },
    ];

    const translatedReportsES = [
      {
        _id: '61d5ad9f102e6e30fca90ddf',
        text: 'translated-es-text **report 1**',
        plain_text: 'translated-es-text report 1',
        title: 'translated-es-title report 1',
        report_number: 1,
      },
    ];

    const reporter = { log: cy.stub() };

    const classificationsCollection = {
      find: cy.stub().returns({
        toArray: cy.stub().resolves(classifications),
      }),
    };

    const reportsENCollection = {
      find: cy.stub().returns({
        toArray: cy.stub().resolves(translatedReportsEN),
      }),
    };

    const reportsESCollection = {
      find: cy.stub().returns({
        toArray: cy.stub().resolves(translatedReportsES),
      }),
    };

    const incidentsCollection = {
      find: cy.stub().returns({
        toArray: cy.stub().resolves(incidents),
      }),
    };

    const projection = {
      _id: 1,
      authors: 1,
      date_downloaded: 1,
      date_modified: 1,
      date_published: 1,
      date_submitted: 1,
      description: 1,
      epoch_date_downloaded: 1,
      epoch_date_modified: 1,
      epoch_date_published: 1,
      epoch_date_submitted: 1,
      image_url: 1,
      language: 1,
      report_number: 1,
      source_domain: 1,
      submitters: 1,
      title: 1,
      url: 1,
      plain_text: 1,
      editor_notes: 1,
      cloudinary_id: 1,
      is_incident_report: 1,
      flag: 1,
    };

    const reportsCollection = {
      find: cy
        .stub()
        .withArgs({}, { projection })
        .returns({
          toArray: cy.stub().resolves(reports),
        }),
    };

    const duplicatesCollection = {
      find: cy.stub().returns({
        toArray: cy.stub().resolves(duplicates),
      }),
    };

    const mongoClient = {
      connect: cy.stub(),
      close: cy.stub(),
      db: cy.stub().returns({
        collection: (() => {
          const stub = cy.stub();

          stub.withArgs('reports').returns(reportsCollection);
          stub.withArgs('classifications').returns(classificationsCollection);
          stub.withArgs('incidents').returns(incidentsCollection);
          stub.withArgs('reports_en').returns(reportsENCollection);
          stub.withArgs('reports_es').returns(reportsESCollection);
          stub.withArgs('duplicates').returns(duplicatesCollection);

          return stub;
        })(),
      }),
    };

    const esIndex = {
      replaceAllObjects: cy.stub().resolves({ objectIDs: ['1', '2'] }),
      setSettings: cy.stub().resolves({}),
      deleteBy: cy.stub().resolves({}),
    };

    const esIndexReplica = {
      setSettings: cy.stub().resolves({}),
    };

    const enIndex = {
      replaceAllObjects: cy.stub().resolves({ objectIDs: ['1', '2'] }),
      setSettings: cy.stub().resolves({}),
      deleteBy: cy.stub().resolves({}),
    };

    const enIndexReplica = {
      setSettings: cy.stub().resolves({}),
    };

    const algoliaClient = {
      initIndex: (() => {
        const stub = cy.stub();

        stub.withArgs('instant_search-es').returns(esIndex);
        stub.withArgs('instant_search-en').returns(enIndex);

        stub.withArgs('instant_search-es-featured').returns(esIndexReplica);
        stub.withArgs('instant_search-en-featured').returns(enIndexReplica);

        stub.withArgs('instant_search-es_epoch_incident_date_desc').returns(esIndexReplica);
        stub.withArgs('instant_search-en_epoch_incident_date_desc').returns(enIndexReplica);

        stub.withArgs('instant_search-es_epoch_incident_date_asc').returns(esIndexReplica);
        stub.withArgs('instant_search-en_epoch_incident_date_asc').returns(enIndexReplica);

        stub.withArgs('instant_search-es_epoch_date_published_desc').returns(esIndexReplica);
        stub.withArgs('instant_search-en_epoch_date_published_desc').returns(enIndexReplica);

        stub.withArgs('instant_search-es_epoch_date_published_asc').returns(esIndexReplica);
        stub.withArgs('instant_search-en_epoch_date_published_asc').returns(enIndexReplica);

        stub.withArgs('instant_search-es_epoch_date_submitted_desc').returns(esIndexReplica);
        stub.withArgs('instant_search-en_epoch_date_submitted_desc').returns(enIndexReplica);

        stub.withArgs('instant_search-es_epoch_date_submitted_asc').returns(esIndexReplica);
        stub.withArgs('instant_search-en_epoch_date_submitted_asc').returns(enIndexReplica);

        return stub;
      })(),
    };

    const updater = new AlgoliaUpdater({
      mongoClient,
      algoliaClient,
      languages: [{ code: 'es' }, { code: 'en' }],
      reporter,
    });

    cy.wrap(updater.run()).then(() => {
      expect(mongoClient.connect.callCount).to.eq(1);

      // english

      expect(enIndex.replaceAllObjects.getCalls().length).eq(1);

      expect(enIndex.replaceAllObjects.getCall(0).args[0].length).eq(2);

      expect(enIndex.replaceAllObjects.getCall(0).args[0][0]).to.deep.nested.include({
        authors: ['Alistair Barr'],
        description: 'Description of report 1',
        epoch_date_downloaded: 1555113600,
        epoch_date_modified: 1592092800,
        epoch_date_published: 1431993600,
        epoch_date_submitted: 1559347200,
        image_url: 'http://url.com',
        language: 'en',
        report_number: 1,
        source_domain: 'blogs.wsj.com',
        submitters: ['Roman Yampolskiy'],
        tags: [],
        text: 'Report 1 text',
        title: 'Report 1 title',
        url: 'https://url.com/stuff',
        objectID: '1',
        mongodb_id: '60dd465f80935bc89e6f9b01',
        incident_id: 1,
        epoch_incident_date: 1592092800,
        incident_date: '2020-06-14',
        namespaces: ['CSETv0'],
        classifications: [
          'CSETv0:Named Entities:Amazon',
          'CSETv0:Harm Type:Harm to physical health/safety',
          'CSETv0:Harm Type:Harm to physical property',
        ],
        CSETv0: {
          'Named Entities': ['Amazon'],
          'Harm Type': ['Harm to physical health/safety', 'Harm to physical property'],
        },
      });

      expect(enIndex.replaceAllObjects.getCall(0).args[0][1]).to.deep.nested.include({
        authors: ['Alistair Barr'],
        description: 'Description of report 23',
        epoch_date_downloaded: 1555113600,
        epoch_date_modified: 1592092800,
        epoch_date_published: 1431993600,
        epoch_date_submitted: 1559347200,
        image_url: 'http://url.com',
        language: 'es',
        report_number: 23,
        source_domain: 'blogs.wsj.com',
        submitters: ['Roman Yampolskiy'],
        tags: [],
        text: 'translated-en-text report 23',
        title: 'translated-en-title report 23',
        url: 'https://url.com/stuff',
        objectID: '23',
        mongodb_id: '60dd465f80935bc89e6f9b02',
        incident_id: 1,
        incident_date: '2020-06-14',
        epoch_incident_date: 1592092800,
        namespaces: ['CSETv0'],
        classifications: [
          'CSETv0:Named Entities:Amazon',
          'CSETv0:Harm Type:Harm to physical health/safety',
          'CSETv0:Harm Type:Harm to physical property',
        ],
        CSETv0: {
          'Named Entities': ['Amazon'],
          'Harm Type': ['Harm to physical health/safety', 'Harm to physical property'],
        },
      });

      expect(enIndex.deleteBy.getCall(0).args[0]).deep.eq({
        filters: 'incident_id = 247',
      });

      ``;
      // spanish

      expect(esIndex.replaceAllObjects.getCalls().length).eq(1);

      expect(esIndex.replaceAllObjects.getCall(0).args[0].length).eq(2);

      expect(esIndex.replaceAllObjects.getCall(0).args[0][0]).to.deep.nested.include({
        authors: ['Alistair Barr'],
        description: 'Description of report 1',
        epoch_date_downloaded: 1555113600,
        epoch_date_modified: 1592092800,
        epoch_date_published: 1431993600,
        epoch_date_submitted: 1559347200,
        image_url: 'http://url.com',
        language: 'en',
        report_number: 1,
        source_domain: 'blogs.wsj.com',
        submitters: ['Roman Yampolskiy'],
        tags: [],
        text: 'translated-es-text report 1',
        title: 'translated-es-title report 1',
        url: 'https://url.com/stuff',
        objectID: '1',
        mongodb_id: '60dd465f80935bc89e6f9b01',
        incident_id: 1,
        incident_date: '2020-06-14',
        epoch_incident_date: 1592092800,
        namespaces: ['CSETv0'],
        classifications: [
          'CSETv0:Named Entities:Amazon',
          'CSETv0:Harm Type:Harm to physical health/safety',
          'CSETv0:Harm Type:Harm to physical property',
        ],
        CSETv0: {
          'Named Entities': ['Amazon'],
          'Harm Type': ['Harm to physical health/safety', 'Harm to physical property'],
        },
        featured: 0,
      });

      expect(esIndex.replaceAllObjects.getCall(0).args[0][1]).to.deep.nested.include({
        authors: ['Alistair Barr'],
        description: 'Description of report 23',
        epoch_date_downloaded: 1555113600,
        epoch_date_modified: 1592092800,
        epoch_date_published: 1431993600,
        epoch_date_submitted: 1559347200,
        image_url: 'http://url.com',
        language: 'es',
        report_number: 23,
        source_domain: 'blogs.wsj.com',
        submitters: ['Roman Yampolskiy'],
        tags: [],
        text: 'Report 23 text',
        title: 'Report 23 title',
        url: 'https://url.com/stuff',
        objectID: '23',
        mongodb_id: '60dd465f80935bc89e6f9b02',
        incident_id: 1,
        incident_date: '2020-06-14',
        epoch_incident_date: 1592092800,
        namespaces: ['CSETv0'],
        classifications: [
          'CSETv0:Named Entities:Amazon',
          'CSETv0:Harm Type:Harm to physical health/safety',
          'CSETv0:Harm Type:Harm to physical property',
        ],
        CSETv0: {
          'Named Entities': ['Amazon'],
          'Harm Type': ['Harm to physical health/safety', 'Harm to physical property'],
        },
        featured: 2,
      });

      expect(esIndex.deleteBy.getCall(0).args[0]).deep.eq({
        filters: 'incident_id = 247',
      });

      expect(mongoClient.close.callCount).to.eq(1);
    });
  });
});
