const availableLocales = JSON.parse('\x5b\x22\\\x22en\\\x22\x22,\x22\\\x22am\\\x22\x22,\x22\\\x22ar\\\x22\x22,\x22\\\x22bn\\\x22\x22,\x22\\\x22bg\\\x22\x22,\x22\\\x22ca\\\x22\x22,\x22\\\x22cs\\\x22\x22,\x22\\\x22cy\\\x22\x22,\x22\\\x22da\\\x22\x22,\x22\\\x22de\\\x22\x22,\x22\\\x22el\\\x22\x22,\x22\\\x22en_GB\\\x22\x22,\x22\\\x22es\\\x22\x22,\x22\\\x22es_419\\\x22\x22,\x22\\\x22et\\\x22\x22,\x22\\\x22eu\\\x22\x22,\x22\\\x22fa\\\x22\x22,\x22\\\x22fi\\\x22\x22,\x22\\\x22fil\\\x22\x22,\x22\\\x22fr\\\x22\x22,\x22\\\x22gl\\\x22\x22,\x22\\\x22gu\\\x22\x22,\x22\\\x22hi\\\x22\x22,\x22\\\x22hr\\\x22\x22,\x22\\\x22hu\\\x22\x22,\x22\\\x22id\\\x22\x22,\x22\\\x22is\\\x22\x22,\x22\\\x22it\\\x22\x22,\x22\\\x22iw\\\x22\x22,\x22\\\x22ja\\\x22\x22,\x22\\\x22kn\\\x22\x22,\x22\\\x22ko\\\x22\x22,\x22\\\x22lt\\\x22\x22,\x22\\\x22lv\\\x22\x22,\x22\\\x22ml\\\x22\x22,\x22\\\x22ms\\\x22\x22,\x22\\\x22my\\\x22\x22,\x22\\\x22nl\\\x22\x22,\x22\\\x22no\\\x22\x22,\x22\\\x22pl\\\x22\x22,\x22\\\x22pt_BR\\\x22\x22,\x22\\\x22pt_PT\\\x22\x22,\x22\\\x22ro\\\x22\x22,\x22\\\x22ru\\\x22\x22,\x22\\\x22sk\\\x22\x22,\x22\\\x22sl\\\x22\x22,\x22\\\x22sr\\\x22\x22,\x22\\\x22sv\\\x22\x22,\x22\\\x22sw\\\x22\x22,\x22\\\x22ta\\\x22\x22,\x22\\\x22te\\\x22\x22,\x22\\\x22th\\\x22\x22,\x22\\\x22tr\\\x22\x22,\x22\\\x22uk\\\x22\x22,\x22\\\x22ur\\\x22\x22,\x22\\\x22vi\\\x22\x22,\x22\\\x22zh_CN\\\x22\x22,\x22\\\x22zh_TW\\\x22\x22,\x22\\\x22zu\\\x22\x22\x5d'); const availableRtlLocales = JSON.parse('\x5b\x22\\\x22ar\\\x22\x22,\x22\\\x22fa\\\x22\x22,\x22\\\x22iw\\\x22\x22,\x22\\\x22ur\\\x22\x22\x5d'); const prefix = 'keep_ba-prod'; _notes_flag_initialData = {"n_cc":"TR, LB, AN, NC, MI, SH, SNB, DR","n_c":"192748556389-k5lj2ak6j74mo13ulslbkqkrd8d6b1bh.apps.googleusercontent.com","n_ur":"edit","n_taau":"https://taskassist-pa.googleapis.com/","n_csbs":120,"n_hak":"AIzaSyCu0mGMINziM4XKlidxSzycNQUx9qjr48g","n_rau":"https://reminders-pa.googleapis.com/","n_dlis":false,"n_afoiu":false,"n_nib":5000,"n_esrl":false,"n_lcu":false,"n_ccd":[],"n_tak":"AIzaSyAqeqEBGxTXZXOnu2gUrYCz9hsfKUr45vU","n_eau":false,"n_sit":["image/jpeg","image/png","image/gif"],"n_wcv":"3.3.0.407","n_uo":true,"n_rs":4,"n_fpae":"https://keep-pa.googleapis.com","n_wfp":false,"n_ep":true,"n_the":true,"n_k":"AIzaSyBx4qIYtgGv7SYh3nV8weWhXKZjIcaYKek","n_oe":true,"n_edtt":false,"n_nmri":5000,"n_pau":"https://people-pa.googleapis.com/","n_cp":"CRX_BA","n_rsrn":false,"n_ecpde":false,"n_nmb":1800000,"n_imb":10485760,"n_tms":604800,"n_imp":26214400,"n_amt":["audio/aac","image/jpeg","image/png","image/gif"],"n_ugat":"CLEARCUT","n_scp":false,"n_ecnwib":false,"n_eoros":false,"n_dt":"","n_tipe":true,"n_tbti":30000,"n_deau":"https://www.googleapis.com/","n_npv":"v1","n_npd":"content-notes-pa.googleapis.com","n_t":true,"n_tcu":{},"n_enpi2026":false,"n_ton":"keep"};
const langSynonyms = {
  'he': 'iw',
}
let locale = window.navigator.language;
if (langSynonyms[locale]) {
  locale = langSynonyms[locale];
}

const direction = availableRtlLocales.indexOf(locale) >= 0 ? 'rtl' : 'ltr';

const jsFileName = prefix + '_app_script_' + direction + '.js';
const jsEl = document.createElement('script');
jsEl.setAttribute('type', 'text/javascript');
jsEl.setAttribute('src', jsFileName);

const cssFileName = prefix + '_app_styles_' + direction + '_default.css';
const cssEl = document.createElement('link');
cssEl.setAttribute('rel', 'stylesheet');
cssEl.setAttribute('href', cssFileName);

const symbolsFileName = availableLocales.indexOf(locale) >= 0 ? locale : 'en';
const symbolsEl = document.createElement('script');
symbolsEl.setAttribute('type', 'text/javascript');
symbolsEl.setAttribute('src', 'i18n/symbols_' + symbolsFileName + '.js');

const head = document.getElementsByTagName('head')[0];
head.appendChild(symbolsEl);
head.appendChild(cssEl);
head.appendChild(jsEl);

jsEl.onload = function() {
  initNotesBrowserAction();
};
