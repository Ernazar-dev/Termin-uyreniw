import { z } from 'zod';

// Custom schema messages take precedence; this covers Zod's built-in English messages.
z.setErrorMap((issue) => {
  let message = 'Kiritilgen maǵlıwmat qáte';
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      message = issue.received === 'undefined' ? 'Bul maydan toltırılıwı shárt' : 'Maǵlıwmat túri qáte';
      break;
    case z.ZodIssueCode.too_small:
      message = `Mánis ${issue.minimum} shamasınan ${issue.inclusive ? 'kem bolmawı' : 'úlken bolıwı'} kerek`;
      break;
    case z.ZodIssueCode.too_big:
      message = `Mánis ${issue.maximum} shamasınan ${issue.inclusive ? 'aspawı' : 'kishi bolıwı'} kerek`;
      break;
    case z.ZodIssueCode.invalid_enum_value:
    case z.ZodIssueCode.invalid_literal:
      message = 'Ruqsat etilgen mánisti tańlań';
      break;
    case z.ZodIssueCode.invalid_string: message = 'Mátin formatı qáte'; break;
    case z.ZodIssueCode.invalid_date: message = 'Sáne qáte'; break;
    case z.ZodIssueCode.not_finite: message = 'Shekli san kiritiń'; break;
    case z.ZodIssueCode.unrecognized_keys: message = 'Artıqsha maydanlar bar'; break;
  }
  return { message };
});
