import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import DlStudioShippingProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [DlStudioShippingProviderService],
})
