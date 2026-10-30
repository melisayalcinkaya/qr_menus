import Sheet from '../components/Sheet'

export default function FilterSheet({ open, onClose, t, lang, meta, filters, onChange, resultCount }) {
  const toggle = (key, code) => {
    const list = filters[key]
    onChange({ ...filters, [key]: list.includes(code) ? list.filter((c) => c !== code) : [...list, code] })
  }
  const count = resultCount(filters)

  return (
    <Sheet open={open} onClose={onClose} title={t.filtersTitle} closeLabel={t.close} className="sheet--filters">
      <fieldset className="choice-group">
        <legend>{t.dietary}</legend>
        {meta?.dietary.map((d) => (
          <label key={d.code} className="choice">
            <input
              type="checkbox"
              checked={filters.dietary.includes(d.code)}
              onChange={() => toggle('dietary', d.code)}
            />
            <span>{d[lang]}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="choice-group">
        <legend>{t.excludeAllergens}</legend>
        {meta?.allergens.map((a) => (
          <label key={a.code} className="choice">
            <input
              type="checkbox"
              checked={filters.excludeAllergens.includes(a.code)}
              onChange={() => toggle('excludeAllergens', a.code)}
            />
            <span>{a[lang]}</span>
          </label>
        ))}
      </fieldset>
      <div className="sheet__actions">
        <button type="button" className="menu-button menu-button--quiet" onClick={() => onChange({ excludeAllergens: [], dietary: [] })}>
          {t.clearFilters}
        </button>
        <button type="button" className="menu-button" onClick={onClose}>
          {t.showResults(count)}
        </button>
      </div>
    </Sheet>
  )
}
