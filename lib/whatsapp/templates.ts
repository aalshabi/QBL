export const DELIVERY_CONFIRMATION_TEMPLATE = "qbl_delivery_confirmation_ar";
export const DELIVERY_CONFIRMATION_COD_TEMPLATE = "qbl_delivery_confirmation_cod_ar";

export const DELIVERY_CONFIRMATION_TEMPLATE_TEXT = "مرحبًا، معك قدام بابك لتوصيل شحنتك رقم {{1}} من {{2}}. نرتّب توصيلها اليوم. هل أنت متواجد ومستعد للاستلام؟ يرجى تأكيد الوقت والموقع.";
export const DELIVERY_CONFIRMATION_COD_TEMPLATE_TEXT = "مرحبًا، معك قدام بابك لتوصيل شحنتك رقم {{1}} من {{2}}. نرتّب توصيلها اليوم. هل أنت متواجد ومستعد للاستلام؟ يرجى تأكيد الوقت والموقع. مبلغ الدفع عند الاستلام: {{3}} ريال.";

export function confirmationTemplate(input: { customerName: string; merchantName: string; shipmentCode: string; codAmount?: string | null }) {
  const common = [input.shipmentCode, input.merchantName];
  return input.codAmount
    ? { name: DELIVERY_CONFIRMATION_COD_TEMPLATE, parameters: [...common, input.codAmount] }
    : { name: DELIVERY_CONFIRMATION_TEMPLATE, parameters: common };
}
