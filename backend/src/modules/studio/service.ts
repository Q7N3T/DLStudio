import { MedusaService } from "@medusajs/framework/utils"
import Studio from "./models/studio"

/** CRUD для студий: retrieveStudio, listStudios, createStudios, updateStudios… */
class StudioModuleService extends MedusaService({ Studio }) {}

export default StudioModuleService
