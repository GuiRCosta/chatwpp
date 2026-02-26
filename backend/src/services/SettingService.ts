import Setting from "../models/Setting"

interface SettingsMap {
  [key: string]: string
}

export const getSettings = async (tenantId: number): Promise<SettingsMap> => {
  const settings = await Setting.findAll({
    where: { tenantId },
    order: [["key", "ASC"]]
  })

  return settings.reduce<SettingsMap>((acc, setting) => ({
    ...acc,
    [setting.key]: setting.value
  }), {})
}

export const getSettingByKey = async (tenantId: number, key: string): Promise<string | null> => {
  const setting = await Setting.findOne({
    where: { tenantId, key }
  })

  return setting ? setting.value : null
}

export const updateSetting = async (tenantId: number, key: string, value: string): Promise<Setting> => {
  const [setting] = await Setting.upsert({
    tenantId,
    key,
    value
  })

  return setting
}

export const updateSettingsBulk = async (tenantId: number, settings: Array<{ key: string; value: string }>): Promise<SettingsMap> => {
  const promises = settings.map(({ key, value }) =>
    Setting.upsert({ tenantId, key, value })
  )

  await Promise.all(promises)

  return getSettings(tenantId)
}
