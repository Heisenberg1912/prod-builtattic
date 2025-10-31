import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { api } from "./api"

const ApiContext = createContext(null)

export function ApiProvider({ children }) {
  const [modes, setModes] = useState([])
  const [activeMode, setActiveMode] = useState("")
  const [summary, setSummary] = useState(null)
  const [weather, setWeather] = useState(null)
  const [inventory, setInventory] = useState([])
  const [finance, setFinance] = useState([])
  const [gallery, setGallery] = useState([])
  const [insights, setInsights] = useState([])
  const [incidents, setIncidents] = useState([])
  const [risks, setRisks] = useState([])
  const [systems, setSystems] = useState([])
  const [kpis, setKpis] = useState({})
  const [user, setUser] = useState(null)
  const [drills, setDrills] = useState([])
  const [chatConfig, setChatConfig] = useState(null)
  const [loading, setLoading] = useState({ summary: false, weather: false })
  const [error, setError] = useState("")
  const [activeSidebar, setActiveSidebar] = useState("Dashboard")
  const [locationOverride, setLocationOverride] = useState("")

  const loadModes = useCallback(async () => {
    try {
      const data = await api.getModes()
      setModes(data)
      setActiveMode((prev) => {
        if (prev && data.some((mode) => mode.name === prev)) return prev
        const preferred = data.find((mode) => mode.is_default) || data[0]
        return preferred?.name || ""
      })
    } catch (err) {
      console.error(err)
      setError("Unable to load modes right now.")
    }
  }, [])

  useEffect(() => {
    loadModes().catch(() => {})
    api
      .getChatConfig()
      .then((config) => setChatConfig(config))
      .catch((err) => {
        console.error(err)
      })
  }, [loadModes])

  const updateLoading = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }))
  }, [])

  const refreshAll = useCallback(
    async (targetMode) => {
      const mode = targetMode || activeMode
      if (!mode) return
      setError("")
      updateLoading("summary", true)
      try {
        const [summaryData, inventoryData, financeData, galleryData, insightsData] =
          await Promise.all([
            api.getDashboardSummary({ mode }),
            api.getInventory({ mode, limit: 120 }),
            api.getFinance({ mode, limit: 120 }),
            api.getGallery({ mode, limit: 24 }),
            api.getInsights({ mode, limit: 12 }),
          ])
        setSummary(summaryData)
        setInventory(inventoryData)
        setFinance(financeData)
        setGallery(galleryData)
        setInsights(insightsData)
        const derivedSystems = Array.isArray(summaryData?.systems)
          ? summaryData.systems
          : Array.isArray(summaryData?.metrics?.systems)
          ? summaryData.metrics.systems
          : Array.from(
              new Map(
                (inventoryData || [])
                  .filter((item) => item?.system_id || item?.system || item?.name)
                  .map((item) => {
                    const rawId = item.system_id || item.system || item.id || item.name
                    const id = String(rawId ?? "")
                    const name =
                      item.system ||
                      item.system_name ||
                      item.systemName ||
                      item.name ||
                      (id ? `System ${id}` : undefined) ||
                      "System"
                    return [id || name, { id: id || name, name }]
                  }),
              ).values(),
            )
        setSystems(Array.isArray(derivedSystems) ? derivedSystems : [])
        setIncidents(
          Array.isArray(summaryData?.incidents)
            ? summaryData.incidents
            : Array.isArray(summaryData?.incident_history)
            ? summaryData.incident_history
            : Array.isArray(summaryData?.metrics?.incidents)
            ? summaryData.metrics.incidents
            : Array.isArray(summaryData?.metrics?.incidentHistory)
            ? summaryData.metrics.incidentHistory
            : []
        )
        const derivedKpis =
          summaryData?.kpis ||
          summaryData?.metrics?.kpis ||
          summaryData?.metrics?.kpi ||
          {}
        setKpis(derivedKpis || {})
        setUser(summaryData?.profile?.user || summaryData?.user || null)
        const galleryList = Array.isArray(galleryData?.drills)
          ? galleryData.drills
          : Array.isArray(galleryData)
          ? galleryData
          : []
        setDrills(galleryList)
        const derivedRisks = Array.isArray(summaryData?.risks)
          ? summaryData.risks
          : Array.isArray(insightsData?.risks)
          ? insightsData.risks
          : Array.isArray(insightsData)
          ? insightsData.filter((item) => (item?.type || item?.category) === "risk")
          : Array.isArray(insightsData?.items)
          ? insightsData.items.filter((item) => (item?.type || item?.category) === "risk")
          : []
        setRisks(derivedRisks)
      } catch (err) {
        console.error(err)
        setError(err.message || "Unable to refresh data right now.")
      } finally {
        updateLoading("summary", false)
      }
    },
    [activeMode, updateLoading],
  )

  const refreshWeather = useCallback(
    async (targetMode) => {
      const mode = targetMode || activeMode
      if (!mode) return
      updateLoading("weather", true)
      try {
        const payload = {
          mode,
        }
        if (locationOverride) {
          payload.city = locationOverride
        }
        const data = await api.getWeatherInsight(payload)
        setWeather(data)
      } catch (err) {
        console.error(err)
        setError(err.message || "Unable to fetch weather insights.")
      } finally {
        updateLoading("weather", false)
      }
    },
    [activeMode, locationOverride, updateLoading],
  )

  useEffect(() => {
    if (!activeMode) return
    refreshAll(activeMode).catch(() => {})
    refreshWeather(activeMode).catch(() => {})
  }, [activeMode, refreshAll, refreshWeather])

  const refreshRisks = useCallback(
    async (targetMode) => {
      await refreshAll(targetMode || activeMode)
    },
    [refreshAll, activeMode],
  )

  const refreshDrills = useCallback(
    async (targetMode) => {
      await refreshAll(targetMode || activeMode)
    },
    [refreshAll, activeMode],
  )

  const updateRiskStatus = useCallback(async (id, payload) => {
    if (!id) throw new Error("Missing risk identifier")
    if (typeof api.updateRiskStatus !== "function") {
      throw new Error("Risk update API is not configured")
    }
    return api.updateRiskStatus(id, payload)
  }, [])

  const value = useMemo(
    () => ({
      modes,
      activeMode,
      setActiveMode,
      summary,
      weather,
      inventory,
      finance,
      gallery,
      insights,
      incidents,
      risks,
      systems,
      drills,
      kpis,
      user,
      chatConfig,
      loading,
      error,
      refreshAll,
      refreshWeather,
      refreshRisks,
      refreshDrills,
      updateRiskStatus,
      activeSidebar,
      setActiveSidebar,
      locationOverride,
      setLocationOverride,
    }),
    [
      modes,
      activeMode,
      summary,
      weather,
      inventory,
      finance,
      gallery,
      insights,
      incidents,
      risks,
      systems,
      drills,
      kpis,
      user,
      chatConfig,
      loading,
      error,
      refreshAll,
      refreshWeather,
      refreshRisks,
      refreshDrills,
      updateRiskStatus,
      activeSidebar,
      setActiveSidebar,
      locationOverride,
    ],
  )

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi() {
  return useContext(ApiContext)
}
