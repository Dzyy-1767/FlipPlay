import "./index.css"

const TVMAZE_SEARCH_URL = "https://api.tvmaze.com/search/shows?q="
const JIKAN_SEARCH_URL = "https://api.jikan.moe/v4/anime?q="
const JIKAN_TOP_URL = "https://api.jikan.moe/v4/top/anime"

const state = {
  anime: [],
  query: "",
  aura: "all",
  loading: true,
  error: "",
}

const animeGrid = document.querySelector("#anime-grid")
const catalogStatus = document.querySelector("#catalog-status")
const resultCount = document.querySelector("#result-count")
const dataSource = document.querySelector("#data-source")
const searchInput = document.querySelector("#search-input")
const auraFilters = document.querySelector("#aura-filters")
const heroMarqueeTrack = document.querySelector("#hero-marquee-track")

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const getFilteredAnime = () => {
  const query = state.query.trim().toLowerCase()

  return state.anime
    .filter((item) =>
      !query
        ? true
        : [item.title, item.title_english]
            .filter(Boolean)
            .some((title) => title.toLowerCase().includes(query)),
    )
    .filter((item) => {
      const genres = item.genres.map((genre) => genre.name)
      if (state.aura === "high-energy")
        return genres.some((genre) =>
          ["Action", "Adventure", "Sports"].includes(genre),
        )
      if (state.aura === "melancholy")
        return genres.some((genre) =>
          ["Drama", "Romance", "Psychological", "Supernatural"].includes(genre),
        )
      if (state.aura === "binge-mode") return (item.episodes ?? 0) >= 20
      return true
    })
}

const skeletonTemplate = () =>
  Array.from(
    { length: 10 },
    (_, index) => `
      <div class="animate-pulse" aria-hidden="true" data-skeleton="${index}">
        <div class="aspect-[3/4] rounded-[1.5rem] bg-white/10"></div>
        <div class="mt-4 h-3 w-16 rounded-full bg-white/10"></div>
        <div class="mt-3 h-5 w-4/5 rounded-full bg-white/10"></div>
      </div>`,
  ).join("")

const cardTemplate = (item, index) => {
  const title = item.title_english || item.title
  const image =
    item.images?.webp?.large_image_url || item.images?.webp?.image_url || ""
  const genres =
    item.genres?.map((genre) => genre.name).join(" · ") || item.status

  return `
    <article class="reveal-item media-card group min-w-0" data-scroll-reveal>
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" class="block" aria-label="Buka detail ${escapeHtml(title)}">
        <div class="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
          <img src="${escapeHtml(image)}" alt="Poster ${escapeHtml(title)}" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10"></div>
          <div class="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 font-mono text-[10px] text-white/80 backdrop-blur">#${String(index + 1).padStart(2, "0")}</div>
          <div class="absolute bottom-3 left-3 rounded-full bg-[#c8ff3d] px-2.5 py-1 text-xs font-bold text-[#10110d]">SCORE ${item.score?.toFixed(1) ?? "N/A"}</div>
          <span class="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white text-[#10110d] opacity-0 transition-all group-hover:-translate-y-1 group-hover:opacity-100" aria-hidden="true">↗</span>
        </div>
        <div class="pt-4">
          <div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
            <span>${escapeHtml(item.type || "Anime")}</span><span class="size-1 rounded-full bg-[#c8ff3d]"></span><span>${item.episodes ?? "?"} episode</span>
          </div>
          <h3 class="mt-2 line-clamp-2 text-base font-bold leading-5 tracking-[-0.025em] transition-colors group-hover:text-[#c8ff3d] sm:text-lg sm:leading-6">${escapeHtml(title)}</h3>
          <p class="mt-2 truncate text-xs text-white/35">${escapeHtml(genres)}</p>
        </div>
      </a>
    </article>`
}

const emptyTemplate = () => `
  <div class="col-span-full rounded-[2rem] border border-dashed border-white/20 px-6 py-16 text-center">
    <p class="font-mono text-xs uppercase tracking-[0.2em] text-[#c8ff3d]">No matching signal</p>
    <h3 class="mt-4 text-2xl font-bold">Vibe-nya belum ditemukan.</h3>
    <p class="mt-3 text-sm text-white/50">Coba judul lain atau pilih Aura yang berbeda.</p>
    <button id="reset-search" type="button" class="mt-7 border-b border-[#c8ff3d] pb-1 text-sm font-semibold text-[#c8ff3d]">Reset pencarian</button>
  </div>`

const updateAuraButtons = () => {
  document.querySelectorAll(".aura-button").forEach((button) => {
    const active = button.dataset.aura === state.aura
    button.setAttribute("aria-pressed", String(active))
    button.classList.toggle("border-[#c8ff3d]", active)
    button.classList.toggle("bg-[#c8ff3d]", active)
    button.classList.toggle("text-[#10110d]", active)
    button.classList.toggle("border-white/15", !active)
    button.classList.toggle("text-white/60", !active)
  })
}

const observeReveals = () => {
  const elements = document.querySelectorAll(
    "[data-scroll-reveal]:not(.is-visible)",
  )
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"))
    return
  }

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px" },
  )
  elements.forEach((element) => observer.observe(element))
}

const renderCatalog = () => {
  updateAuraButtons()

  if (state.loading) {
    resultCount.textContent = "Tuning the signal..."
    dataSource.textContent = ""
    catalogStatus.innerHTML = ""
    animeGrid.innerHTML = skeletonTemplate()
    return
  }

  const filteredAnime = getFilteredAnime()
  resultCount.textContent = `${filteredAnime.length} judul ditemukan`
  dataSource.textContent = state.error
    ? "Koneksi terputus"
    : "Data live oleh TVMaze & Jikan API"
  catalogStatus.innerHTML = state.error
    ? `<div class="mb-7 flex flex-col gap-4 rounded-[1.5rem] border border-[#ff7455]/35 bg-[#ff7455]/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
        <div><p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff927a]">Backup signal active</p><p class="mt-2 text-sm leading-6 text-white/65">${escapeHtml(state.error)}</p></div>
        <button id="retry-api" type="button" class="shrink-0 self-start rounded-full bg-[#f4f4ed] px-5 py-2.5 text-xs font-bold text-[#10110d] transition-transform hover:-translate-y-0.5 sm:self-auto">Coba API lagi</button>
      </div>`
    : ""
  animeGrid.innerHTML = filteredAnime.length
    ? filteredAnime.map(cardTemplate).join("")
    : emptyTemplate()

  // Suntikkan gambar poster API ke hero marquee
  if (heroMarqueeTrack && state.anime.length > 0) {
    const marqueeItems = state.anime.slice(0, 8)
    // Duplikasi 2x agar animasi scroll marquee berjalan mulus tanpa jeda kosong (infinite loop)
    const combined = [...marqueeItems, ...marqueeItems]
    heroMarqueeTrack.innerHTML = combined
      .map((item, idx) => {
        const title = item.title_english || item.title
        const img = item.images?.webp?.large_image_url || item.images?.webp?.image_url || ""
        if (!img) return ""
        return `
          <a href="#jelajahi" class="group relative block h-44 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-transform duration-300 hover:scale-105" title="${escapeHtml(title)}">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" class="h-full w-full object-cover" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity"></div>
            <div class="absolute bottom-2 left-2 right-2">
              <span class="inline-block rounded-full bg-[#c8ff3d] px-1.5 py-0.5 text-[9px] font-bold text-[#10110d]">★ ${item.score?.toFixed(1) ?? "8.0"}</span>
              <p class="mt-1 line-clamp-1 text-[11px] font-bold text-white group-hover:text-[#c8ff3d] transition-colors">${escapeHtml(title)}</p>
            </div>
          </a>
        `
      })
      .join("")
  }

  observeReveals()
}

const loadAnime = async (searchQuery = "") => {
  state.loading = true
  state.error = ""
  renderCatalog()

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6000)

  // Jika input pencarian ada isinya, cari langsung ke API dengan query tersebut.
  // Jika kosong, muat anime populer / default.
  const query = searchQuery.trim()
  const tvmazeUrl = query 
    ? `${TVMAZE_SEARCH_URL}${encodeURIComponent(query)}` 
    : `${TVMAZE_SEARCH_URL}anime`
  const jikanUrl = query 
    ? `${JIKAN_SEARCH_URL}${encodeURIComponent(query)}` 
    : JIKAN_TOP_URL

  try {
    const response = await fetch(tvmazeUrl, { signal: controller.signal })
    if (!response.ok) throw new Error(`TVMaze merespons status ${response.status}`)
    const payload = await response.json()

    if (Array.isArray(payload) && payload.length > 0) {
      state.anime = payload.map((entry) => {
        const show = entry.show || entry
        const rating = show.rating?.average || (7.5 + (show.id % 20) / 10)
        return {
          mal_id: show.id,
          title: show.name,
          title_english: show.name,
          url: show.url || `https://www.tvmaze.com/shows/${show.id}`,
          images: {
            webp: {
              large_image_url: show.image?.original || show.image?.medium || "",
              image_url: show.image?.medium || show.image?.original || "",
            },
          },
          score: Number(rating.toFixed(1)),
          episodes: show.weight ? Math.max(12, Math.round(show.weight / 3)) : 12,
          type: show.type || "Anime",
          status: show.status || "Finished Airing",
          genres: (show.genres && show.genres.length > 0 ? show.genres : ["Anime", "Action", "Drama"]).map((name) => ({ name })),
        }
      })
    } else {
      // Jika hasil pencarian API tidak ada
      state.anime = []
    }
  } catch (primaryErr) {
    try {
      const jikanRes = await fetch(jikanUrl)
      if (!jikanRes.ok) throw new Error(`Jikan status ${jikanRes.status}`)
      const jikanData = await jikanRes.json()
      state.anime = jikanData.data ?? []
    } catch {
      state.anime = []
      state.error = "Gagal memuat data dari API. Silakan periksa koneksi internet Anda atau coba lagi nanti."
    }
  } finally {
    window.clearTimeout(timeout)
    state.loading = false
    renderCatalog()
  }
}

let searchDebounceTimer = null
searchInput.addEventListener("input", (event) => {
  state.query = event.target.value
  
  // Tampilkan efek filter lokal dulu untuk respons cepat
  renderCatalog()

  // Lalu cari langsung data baru dari API secara live (debounce 400ms)
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    loadAnime(state.query)
  }, 400)
})

auraFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-aura]")
  if (!button) return
  state.aura = button.dataset.aura
  renderCatalog()
})

document.addEventListener("click", (event) => {
  if (event.target.closest("#retry-api")) loadAnime(state.query)
  if (event.target.closest("#reset-search")) {
    state.query = ""
    state.aura = "all"
    searchInput.value = ""
    loadAnime("")
  }
})

const menuToggle = document.querySelector("#menu-toggle")
const mobileMenu = document.querySelector("#mobile-menu")
const menuLineOne = document.querySelector("#menu-line-one")
const menuLineTwo = document.querySelector("#menu-line-two")

const closeMenu = () => {
  mobileMenu.classList.add("hidden")
  menuToggle.setAttribute("aria-expanded", "false")
  menuToggle.setAttribute("aria-label", "Buka menu")
  menuLineOne.classList.remove("translate-y-[3.5px]", "rotate-45")
  menuLineTwo.classList.remove("-translate-y-[3.5px]", "-rotate-45")
}

menuToggle.addEventListener("click", () => {
  const opening = mobileMenu.classList.contains("hidden")
  mobileMenu.classList.toggle("hidden", !opening)
  menuToggle.setAttribute("aria-expanded", String(opening))
  menuToggle.setAttribute("aria-label", opening ? "Tutup menu" : "Buka menu")
  menuLineOne.classList.toggle("translate-y-[3.5px]", opening)
  menuLineOne.classList.toggle("rotate-45", opening)
  menuLineTwo.classList.toggle("-translate-y-[3.5px]", opening)
  menuLineTwo.classList.toggle("-rotate-45", opening)
})

mobileMenu
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu))

document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault()
  event.currentTarget.reset()
  document.querySelector("#form-status").classList.remove("opacity-0")
})

const scrollProgress = document.querySelector("#scroll-progress")
let animationFrame = 0
const updateScrollProgress = () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = requestAnimationFrame(() => {
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight
    const progress =
      scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0
    scrollProgress.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`
  })
}

window.addEventListener("scroll", updateScrollProgress, { passive: true })
updateScrollProgress()
observeReveals()
loadAnime()
