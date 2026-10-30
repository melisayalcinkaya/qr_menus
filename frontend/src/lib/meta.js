import { api } from './api'

let cache = null

/** Alerjen, beslenme etiketi, tema ve ikon listeleri (sunucudaki tek kaynak). */
export function loadMeta() {
  cache ??= api('/meta/', { auth: false }).catch((err) => {
    cache = null
    throw err
  })
  return cache
}
