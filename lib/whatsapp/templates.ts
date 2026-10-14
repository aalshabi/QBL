export const DELIVERY_CONFIRMATION_TEMPLATE = "qbl_delivery_confirmation_ar";
export const DELIVERY_CONFIRMATION_COD_TEMPLATE = "qbl_delivery_confirmation_cod_ar";

export function confirmationTemplate(input: { customerName: string; merchantName: string; shipmentCode: string; codAmount?: string | null }) {
  const common = [input.customerName, input.merchantName, input.shipmentCode];
  return input.codAmount
    ? { name: DELIVERY_CONFIRMATION_COD_TEMPLATE, parameters: [...common, input.codAmount] }
    : { name: DELIVERY_CONFIRMATION_TEMPLATE, parameters: common };
}
