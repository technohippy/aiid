import gql from 'graphql-tag';

export const FIND_CLASSIFICATION = gql`
  query FindClassifications($query: ClassificationQueryInput) {
    classifications(query: $query) {
      _id
      incidents {
        incident_id
      }
      reports {
        report_number
      }
      notes
      namespace
      attributes {
        short_name
        value_json
      }
      publish
    }
  }
`;

export const UPSERT_CLASSIFICATION = gql`
  mutation UpsertClassification(
    $query: ClassificationQueryInput
    $data: ClassificationInsertInput!
  ) {
    upsertOneClassification(query: $query, data: $data) {
      _id
      incidents {
        incident_id
      }
      reports {
        report_number
      }
      notes
      namespace
      attributes {
        short_name
        value_json
      }
      publish
    }
  }
`;

export const UPDATE_CLASSIFICATIONS = gql`
  mutation UpdateClassifications(
    $query: ClassificationQueryInput
    $set: ClassificationInsertInput!
  ) {
    updateManyClassifications(query: $query, set: $set) {
      _id
      incidents
      notes
      namespace
      attributes {
        short_name
        value_json
      }
      publish
    }
  }
`;
