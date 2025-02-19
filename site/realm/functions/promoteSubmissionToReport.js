function getUnixTime(dateString) {

  return BSON.Int32(Math.floor(new Date(dateString).getTime() / 1000));
}

exports = async (input) => {

  const submissions = context.services.get('mongodb-atlas').db('aiidprod').collection("submissions");
  const incidents = context.services.get('mongodb-atlas').db('aiidprod').collection("incidents");
  const reports = context.services.get('mongodb-atlas').db('aiidprod').collection("reports");
  const subscriptionsCollection = context.services.get('mongodb-atlas').db('customData').collection("subscriptions");
  const notificationsCollection = context.services.get('mongodb-atlas').db('customData').collection("notifications");
  const incidentsHistory = context.services.get('mongodb-atlas').db('history').collection("incidents");
  const reportsHistory = context.services.get('mongodb-atlas').db('history').collection("reports");

  const { _id: undefined, ...submission } = await submissions.findOne({ _id: input.submission_id });

  const parentIncidents = await incidents.find({ incident_id: { $in: input.incident_ids } }).toArray();

  const report_number = (await reports.find({}).sort({ report_number: -1 }).limit(1).next()).report_number + 1;

  if (input.is_incident_report) {

    if (parentIncidents.length == 0) {

      const lastIncident = await incidents.find({}).sort({ incident_id: -1 }).limit(1).next();

      const editors = (!submission.incident_editors || !submission.incident_editors.length)
        ? ['65031f49ec066d7c64380f5c'] // Default user. For more information refer to the wiki page: https://github.com/responsible-ai-collaborative/aiid/wiki/Special-non%E2%80%90secret-values
        : submission.incident_editors;

      const newIncident = {
        title: submission.incident_title || submission.title,
        description: submission.description,
        incident_id: lastIncident.incident_id + 1,
        reports: [],
        editors,
        date: submission.incident_date,
        epoch_date_modified: submission.epoch_date_modified,
        "Alleged deployer of AI system": submission.deployers || [],
        "Alleged developer of AI system": submission.developers || [],
        "Alleged harmed or nearly harmed parties": submission.harmed_parties || [],
        nlp_similar_incidents: submission.nlp_similar_incidents || [],
        editor_similar_incidents: submission.editor_similar_incidents || [],
        editor_dissimilar_incidents: submission.editor_dissimilar_incidents || [],
      }
      if (submission.embedding) {
        newIncident.embedding = {
          vector: submission.embedding.vector,
          from_reports: [BSON.Int32(report_number)]
        }
      }

      await incidents.insertOne({ ...newIncident, incident_id: BSON.Int32(newIncident.incident_id) });

      if (submission.user) {

        await notificationsCollection.insertOne({
          type: 'submission-promoted',
          incident_id: BSON.Int32(newIncident.incident_id),
          processed: false,
          userId: submission.user
        });
      }

      const incidentHistory = {
        ...newIncident,
        reports: [BSON.Int32(report_number)],
        incident_id: BSON.Int32(newIncident.incident_id),
      };

      if (submission.user) {
        incidentHistory.modifiedBy = submission.user;
      }

      await incidentsHistory.insertOne(incidentHistory);

      parentIncidents.push(newIncident);

    } else if (submission.embedding) {
      for (const parentIncident of parentIncidents) {

        const matchingReports = [];

        for (const report_number of parentIncident.reports) {
          matchingReports.push(await reports.findOne({ report_number }));
        }

        const embeddings = matchingReports
          .map(report => report.embedding)
          .filter(e => e != null)
          .concat([submission.embedding]);

        const embedding = {
          vector:
            embeddings.map(e => e.vector).reduce(
              (sum, vector) => (
                vector.map(
                  (component, i) => component + sum[i]
                )
              ),
              Array(embeddings[0].vector.length).fill(0)
            ).map(component => component / embeddings.length),

          from_reports:
            matchingReports
              .map(report => BSON.Int32(report.report_number))
              .concat([BSON.Int32(report_number)])
        };

        await incidents.updateOne(
          { incident_id: BSON.Int32(parentIncident.incident_id) },
          { $set: { ...parentIncident, embedding } }
        );
        
        let incidentValues = parentIncident;

        delete incidentValues._id; // Otherwise Mongo complains about duplicate _id in incidentsHistory
        
        const incidentHistory = {
          ...incidentValues,
          reports: [...incidentValues.reports, BSON.Int32(report_number)],
          embedding,
        }

        if (submission.user) {
          incidentHistory.modifiedBy = submission.user;
        }
        await incidentsHistory.insertOne(incidentHistory);
      }
    }
  }

  const newReport = {
    report_number,
    is_incident_report: input.is_incident_report,
    title: submission.title,
    date_downloaded: new Date(submission.date_downloaded),
    date_modified: new Date(submission.date_modified),
    date_published: new Date(submission.date_published),
    date_submitted: new Date(submission.date_submitted),
    epoch_date_downloaded: getUnixTime(submission.date_downloaded),
    epoch_date_modified: submission.epoch_date_modified,
    epoch_date_published: getUnixTime(submission.date_published),
    epoch_date_submitted: getUnixTime(submission.date_submitted),
    image_url: submission.image_url,
    cloudinary_id: submission.cloudinary_id,
    authors: submission.authors,
    submitters: submission.submitters,
    text: submission.text,
    plain_text: submission.plain_text,
    url: submission.url,
    source_domain: submission.source_domain,
    language: submission.language,
    tags: submission.tags,
  };
  if (submission.embedding) {
    newReport.embedding = submission.embedding;
  }

  if (submission.user) {
    newReport.user = submission.user;
  }

  await reports.insertOne({ ...newReport, report_number: BSON.Int32(newReport.report_number) });

  const incident_ids = parentIncidents.map(incident => incident.incident_id);
  const report_numbers = [newReport.report_number];

  await context.functions.execute('linkReportsToIncidents', { incident_ids, report_numbers });

  const reportHistory = {
    ...newReport,
    report_number: BSON.Int32(newReport.report_number),
  };

  if (submission.user) {
    reportHistory.modifiedBy = submission.user;
  }

  await reportsHistory.insertOne(reportHistory);

  await submissions.deleteOne({ _id: input.submission_id });

  return {
    incident_ids,
    report_number,
  }
};

if (typeof module === 'object') {
  module.exports = exports;
}
