import { Module } from "@medusajs/framework/utils"
import StudioModuleService from "./service"

export const STUDIO_MODULE = "studio"

export default Module(STUDIO_MODULE, { service: StudioModuleService })
