import {
  faNewspaper,
  faIdCard,
  faUserShield,
  faFlag,
  faHashtag,
  faCalendarAlt,
  faTags,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';

const REFINEMENT_LISTS = [
  {
    attribute: 'classifications',
    placeholder: 'Type Here',
    label: 'Classifications',
    faIcon: faNewspaper,
    faClasses: 'far fa-newspaper',
    type: 'classifications',
    width: 420,

    // algolia specific
    showMore: true,
    showMoreLimit: 50,
  },
  {
    attribute: 'source_domain',
    placeholder: 'Type Here',
    label: 'Source',
    faIcon: faNewspaper,
    faClasses: 'far fa-newspaper',
    type: 'refinement',

    // algolia specific
    showMore: true,
    showMoreLimit: 50,
  },
  {
    attribute: 'authors',
    placeholder: 'Type Here',
    label: 'Authors',
    faIcon: faIdCard,
    faClasses: 'far fa-id-card',
    type: 'refinement',

    // algolia specific
    showMore: true,
    showMoreLimit: 50,
  },
  {
    attribute: 'submitters',
    placeholder: 'Type Here',
    label: 'Submitters',
    faIcon: faUserShield,
    faClasses: 'fas fa-user-shield',
    type: 'refinement',

    // algolia specific
    showMore: true,
    showMoreLimit: 50,
  },
  {
    attribute: 'incident_id',
    placeholder: 'Type Here',
    label: 'Incident ID',
    faIcon: faHashtag,
    faClasses: 'fas fa-hashtag',
    type: 'refinement',

    // algolia specific
    showMore: true,
    showMoreLimit: 50,
  },
  {
    attribute: 'epoch_incident_date',
    placeholder: 'Type Here',
    label: 'Incident Date',
    faIcon: faCalendarAlt,
    faClasses: 'far fa-calendar-alt',
    type: 'range',
  },
  {
    attribute: 'epoch_date_published',
    placeholder: 'none',
    label: 'Published Date',
    faIcon: faCalendarAlt,
    faClasses: 'far fa-calendar-alt',
    type: 'range',
  },
  {
    attribute: 'flag',
    placeholder: 'none',
    label: 'Flagged',
    faIcon: faFlag,
    faClasses: 'far fa-flag',
    type: 'refinement',
  },
  {
    attribute: 'is_incident_report',
    placeholder: 'none',
    label: '',
    faIcon: null,
    faClasses: '',
    type: 'refinement',
    hidden: true,
  },
  {
    attribute: 'tags',
    placeholder: 'Type Here',
    label: 'Tags',
    faIcon: faTags,
    faClasses: 'far fa-tags',
    type: 'refinement',
    hidden: false,
  },
  {
    attribute: 'language',
    placeholder: 'Type Here',
    label: 'Language',
    faIcon: faGlobe,
    faClasses: 'far fa-globe',
    type: 'refinement',
    hidden: false,

    // algolia specific
    showMore: true,
    showMoreLimit: 50,
  },
];

export default REFINEMENT_LISTS;
