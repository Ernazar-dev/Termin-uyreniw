import type { Locale } from 'antd/es/locale';

const range = {
  len: '${label}: ${len} bolıwı kerek',
  min: '${label}: keminde ${min} bolıwı kerek',
  max: '${label}: ${max} shamasınan aspawı kerek',
  range: '${label}: ${min}–${max} aralıǵında bolıwı kerek',
};
const invalid = '${label} maydanındaǵı maǵlıwmat qáte';

/** Shared text for every Ant Design component used by the application. */
export const kaaLocale: Locale = {
  locale: 'kaa',
  global: { placeholder: 'Tańlań', close: 'Jabıw', sortable: 'Tártiplenedi', show: 'Kórsetiw', hide: 'Jasırıw' },
  Pagination: {
    items_per_page: '/ bet', jump_to: 'Ótiw', jump_to_confirm: 'Tastıyıqlaw', page: 'bet',
    prev_page: 'Aldınǵı bet', next_page: 'Keyingi bet', prev_5: '5 bet artqa', next_5: '5 bet alǵa',
    prev_3: '3 bet artqa', next_3: '3 bet alǵa', page_size: 'Bettegi jazıwlar sanı',
  },
  Table: {
    filterTitle: 'Súzgi', filterConfirm: 'Qollanıw', filterReset: 'Tazalaw', filterEmptyText: 'Súzgiler joq',
    filterCheckAll: 'Barlıǵın tańlaw', filterSearchPlaceholder: 'Súzgilerden izlew', emptyText: 'Maǵlıwmat joq',
    selectAll: 'Usı bettegilerdi tańlaw', selectInvert: 'Tańlawdı kerisine ózgertiw', selectNone: 'Tańlawdı biykarlaw',
    selectionAll: 'Barlıǵın tańlaw', sortTitle: 'Tártiplew', expand: 'Qatardı ashıw', collapse: 'Qatardı jıyıw',
    triggerDesc: 'Kemeyiw tártibinde jaylastırıw', triggerAsc: 'Ósiw tártibinde jaylastırıw', cancelSort: 'Tártipti biykarlaw',
  },
  Modal: { okText: 'Tastıyıqlaw', cancelText: 'Biykarlaw', justOkText: 'Túsinikli' },
  Popconfirm: { okText: 'Tastıyıqlaw', cancelText: 'Biykarlaw' },
  Select: { notFoundContent: 'Maǵlıwmat tabılmadı' },
  Upload: { uploading: 'Júklenip atır…', removeFile: 'Fayldı óshiriw', uploadError: 'Fayl júklenbedi', previewFile: 'Fayldı kóriw', downloadFile: 'Fayldı júklep alıw' },
  Empty: { description: 'Maǵlıwmat joq' },
  Icon: { icon: 'Belgi' },
  Text: { edit: 'Ózgertiw', copy: 'Kóshiriw', copied: 'Kóshirildi', expand: 'Tolıq kórsetiw', collapse: 'Qısqartıw' },
  Tour: { Next: 'Keyingi', Previous: 'Aldınǵı', Finish: 'Tamamlaw' },
  Form: {
    optional: '(májbúriy emes)',
    defaultValidateMessages: {
      default: invalid, required: '${label} maydanın toltırıń', enum: '${label} ushın ruqsat etilgen mánisti tańlań',
      whitespace: '${label} tek boslıqlardan ibarat bolmawı kerek',
      date: { format: 'Sáne formatı qáte', parse: 'Sáneni anıqlaw múmkin bolmadı', invalid: 'Sáne qáte' },
      types: Object.fromEntries(['string', 'method', 'array', 'object', 'number', 'date', 'boolean', 'integer', 'float', 'regexp', 'email', 'url', 'hex'].map(type => [type, invalid])),
      string: { len: '${label}: ${len} belgi bolıwı kerek', min: '${label}: keminde ${min} belgi kerek', max: '${label}: ${max} belgiden aspawı kerek', range: '${label}: ${min}–${max} belgi bolıwı kerek' },
      number: range, array: range, pattern: { mismatch: '${label} formatı qáte' },
    },
  },
};
