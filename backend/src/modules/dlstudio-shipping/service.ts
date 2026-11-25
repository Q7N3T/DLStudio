import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  CreateFulfillmentResult,
  FulfillmentOption,
} from "@medusajs/framework/types"
import { randomBytes } from "node:crypto"
import {
  isCarrierCode,
  itemsTotal,
  resolveTariffs,
  shippingPrice,
  type ShippingTariffsOptions,
} from "./tariffs"

/**
 * Провайдер доставки-заглушка: СДЭК и Почта России с фиксированными тарифами
 * и бесплатной доставкой от порога. Цена считается провайдером (price_type: "calculated"),
 * поэтому порог учитывается автоматически при каждом пересчёте корзины.
 *
 * Чтобы подключить реальное API, достаточно заменить calculatePrice / createFulfillment:
 * интерфейс и данные опций (data.carrier) останутся прежними.
 *
 * provider_id в базе: `dlstudio-shipping_stub` (identifier + id из medusa-config).
 */
class DlStudioShippingProviderService extends AbstractFulfillmentProviderService {
  static identifier = "dlstudio-shipping"

  protected readonly options_: ShippingTariffsOptions

  constructor(_container: Record<string, unknown>, options: ShippingTariffsOptions = {}) {
    super()
    this.options_ = options
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    const { tariffs } = resolveTariffs(this.options_)
    return [
      ...Object.values(tariffs).map((t) => ({
        id: t.code,
        carrier: t.code,
        name: t.name,
        description: t.description,
        days_min: t.days_min,
        days_max: t.days_max,
      })),
      { id: "return", carrier: "cdek", name: "Возврат через СДЭК", is_return: true },
    ]
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return isCarrierCode(data.carrier ?? data.id)
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const carrier = optionData.carrier ?? optionData.id
    if (!isCarrierCode(carrier)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Неизвестный перевозчик: ${String(carrier)}`)
    }
    return { ...data, carrier }
  }

  async canCalculate(): Promise<boolean> {
    return true
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const carrier = optionData.carrier ?? optionData.id
    if (!isCarrierCode(carrier)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Неизвестный перевозчик: ${String(carrier)}`)
    }
    const total = itemsTotal(context?.items as { unit_price?: unknown; quantity?: unknown }[])
    return {
      calculated_amount: shippingPrice(carrier, total, this.options_),
      is_calculated_price_tax_inclusive: true,
    }
  }

  async createFulfillment(data: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    // Заглушка: «регистрируем» отправление и выдаём фиктивный трек-номер
    const carrier = isCarrierCode(data.carrier) ? data.carrier : "cdek"
    const tracking = `${carrier === "cdek" ? "CDEK" : "RP"}-${randomBytes(5).toString("hex").toUpperCase()}`
    return {
      data: { ...data, carrier, tracking_number: tracking, stub: true },
      labels: [{ tracking_number: tracking, tracking_url: "", label_url: "" }],
    }
  }

  async cancelFulfillment(): Promise<Record<string, unknown>> {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: { carrier: "cdek", stub: true }, labels: [] }
  }
}

export default DlStudioShippingProviderService
