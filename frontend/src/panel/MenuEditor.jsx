import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import Sheet from '../components/Sheet'
import CategoryIcon from '../components/CategoryIcon'
import { api, apiList } from '../lib/api'
import { formatPrice } from '../lib/format'
import { loadMeta } from '../lib/meta'
import { useAsync } from '../lib/useAsync'
import { FieldError, LoadState, PageHeader } from './ui'
import { useToast } from './Toast'

export default function MenuEditor() {
  const { business } = useOutletContext()
  const toast = useToast()
  const meta = useAsync(loadMeta, [])
  const state = useAsync(async () => {
    const [categories, products] = await Promise.all([
      apiList(`/categories/?business=${business.slug}`),
      apiList(`/products/?business=${business.slug}`),
    ])
    return categories.map((c) => ({ ...c, products: products.filter((p) => p.category === c.id) }))
  }, [business.slug])
  const [editing, setEditing] = useState(null) // {kind:'category'|'product', item, categoryId}

  async function remove(kind, item) {
    const message =
      kind === 'category'
        ? `“${item.name}” kategorisi ve içindeki ${item.products.length} ürün silinsin mi?`
        : `“${item.name}” silinsin mi?`
    if (!window.confirm(message)) return
    try {
      await api(`/${kind === 'category' ? 'categories' : 'products'}/${item.id}/`, { method: 'DELETE' })
      toast('Silindi')
      state.reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function move(kind, list, index, delta) {
    const target = index + delta
    if (target < 0 || target >= list.length) return
    const reordered = [...list]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const url = kind === 'category' ? 'categories' : 'products'
    try {
      // Sıralamayı 0..n olarak yeniden yaz; yalnızca değişenleri gönder
      await Promise.all(
        reordered.map((item, position) =>
          item.position === position
            ? null
            : api(`/${url}/${item.id}/`, { method: 'PATCH', body: { position } }),
        ),
      )
      state.reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function toggleActive(product) {
    state.setData((cats) =>
      cats.map((c) => ({
        ...c,
        products: c.products.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p)),
      })),
    )
    try {
      await api(`/products/${product.id}/`, { method: 'PATCH', body: { is_active: !product.is_active } })
      toast(product.is_active ? `${product.name} menüden gizlendi` : `${product.name} menüde gösteriliyor`)
    } catch (err) {
      toast(err.message, 'error')
      state.reload()
    }
  }

  const done = (message) => {
    setEditing(null)
    toast(message)
    state.reload()
  }

  return (
    <>
      <PageHeader title="Menü">
        <button type="button" className="btn btn--primary" onClick={() => setEditing({ kind: 'category' })}>
          <Plus size={16} aria-hidden="true" /> Kategori ekle
        </button>
      </PageHeader>

      <LoadState
        state={state}
        empty={{
          when: state.data?.length === 0,
          node: (
            <div className="empty">
              <p>Menünüz henüz boş.</p>
              <p className="muted">Önce “Çorbalar” ya da “Sıcak içecekler” gibi bir kategori ekleyin, sonra içine ürünleri girin.</p>
            </div>
          ),
        }}
      >
        <div className="menu-editor">
          {state.data?.map((category, ci) => (
            <section key={category.id} className="cat-block" aria-labelledby={`cat-${category.id}`}>
              <header className="cat-block__head">
                <CategoryIcon name={category.icon} size={20} className="cat-block__icon" />
                <h2 id={`cat-${category.id}`}>
                  {category.name}
                  {category.name_en && <span className="muted"> / {category.name_en}</span>}
                </h2>
                <div className="row-actions">
                  <IconBtn label="Yukarı taşı" onClick={() => move('category', state.data, ci, -1)} disabled={ci === 0}>
                    <ArrowUp size={16} />
                  </IconBtn>
                  <IconBtn
                    label="Aşağı taşı"
                    onClick={() => move('category', state.data, ci, 1)}
                    disabled={ci === state.data.length - 1}
                  >
                    <ArrowDown size={16} />
                  </IconBtn>
                  <IconBtn label={`${category.name} kategorisini düzenle`} onClick={() => setEditing({ kind: 'category', item: category })}>
                    <Pencil size={16} />
                  </IconBtn>
                  <IconBtn label={`${category.name} kategorisini sil`} onClick={() => remove('category', category)} danger>
                    <Trash2 size={16} />
                  </IconBtn>
                </div>
              </header>

              {category.products.length > 0 && (
                <ul className="product-rows">
                  {category.products.map((p, pi) => (
                    <li key={p.id} className={`product-row${p.is_active ? '' : ' is-inactive'}`}>
                      <div className="product-row__main">
                        <p className="product-row__name">
                          {p.name}
                          {p.is_popular && <Star size={14} className="product-row__star" aria-label="Sevilen" />}
                        </p>
                        <p className="product-row__meta">
                          <span>{formatPrice(p.price)}</span>
                          {p.allergens.length > 0 && <span>{p.allergens.length} alerjen</span>}
                          {!p.name_en && <span className="warn">İngilizce ad eksik</span>}
                        </p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={p.is_active} onChange={() => toggleActive(p)} />
                        <span className="switch__track" aria-hidden="true" />
                        <span className="visually-hidden">{p.name} menüde görünsün</span>
                      </label>
                      <div className="row-actions">
                        <IconBtn label="Yukarı taşı" onClick={() => move('product', category.products, pi, -1)} disabled={pi === 0}>
                          <ArrowUp size={16} />
                        </IconBtn>
                        <IconBtn
                          label="Aşağı taşı"
                          onClick={() => move('product', category.products, pi, 1)}
                          disabled={pi === category.products.length - 1}
                        >
                          <ArrowDown size={16} />
                        </IconBtn>
                        <IconBtn label={`${p.name} ürününü düzenle`} onClick={() => setEditing({ kind: 'product', item: p, categoryId: category.id })}>
                          <Pencil size={16} />
                        </IconBtn>
                        <IconBtn label={`${p.name} ürününü sil`} onClick={() => remove('product', p)} danger>
                          <Trash2 size={16} />
                        </IconBtn>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn--ghost cat-block__add"
                onClick={() => setEditing({ kind: 'product', categoryId: category.id })}
              >
                <Plus size={16} aria-hidden="true" /> {category.name} kategorisine ürün ekle
              </button>
            </section>
          ))}
        </div>
      </LoadState>

      <Sheet
        open={editing?.kind === 'category'}
        onClose={() => setEditing(null)}
        title={editing?.item ? 'Kategoriyi düzenle' : 'Yeni kategori'}
        className="sheet--panel"
      >
        {editing?.kind === 'category' && (
          <CategoryForm
            business={business}
            item={editing.item}
            nextPosition={state.data?.length || 0}
            icons={meta.data?.category_icons || []}
            onDone={done}
          />
        )}
      </Sheet>
      <Sheet
        open={editing?.kind === 'product'}
        onClose={() => setEditing(null)}
        title={editing?.item ? 'Ürünü düzenle' : 'Yeni ürün'}
        className="sheet--panel sheet--wide"
      >
        {editing?.kind === 'product' && (
          <ProductForm
            item={editing.item}
            categoryId={editing.categoryId}
            categories={state.data || []}
            meta={meta.data}
            onDone={done}
          />
        )}
      </Sheet>
    </>
  )
}

function IconBtn({ label, children, danger, ...props }) {
  return (
    <button type="button" className={`icon-button${danger ? ' icon-button--danger' : ''}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

function CategoryForm({ business, item, nextPosition, icons, onDone }) {
  const [errors, setErrors] = useState({})
  const [icon, setIcon] = useState(item?.icon || 'utensils')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = { business: business.slug, name: form.get('name'), name_en: form.get('name_en'), icon }
    if (!item) body.position = nextPosition
    setBusy(true)
    try {
      await api(item ? `/categories/${item.id}/` : '/categories/', { method: item ? 'PATCH' : 'POST', body })
      onDone(item ? 'Kategori güncellendi' : 'Kategori eklendi')
    } catch (err) {
      setErrors(err.fieldErrors.name || err.fieldErrors.business ? err.fieldErrors : { form: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Ad</span>
          <input name="name" required maxLength={100} defaultValue={item?.name} />
          <FieldError errors={errors.name} />
        </label>
        <label className="field">
          <span>İngilizce ad</span>
          <input name="name_en" maxLength={100} defaultValue={item?.name_en} lang="en" />
        </label>
      </div>
      <fieldset className="icon-picker">
        <legend>İkon</legend>
        {icons.map((opt) => (
          <label key={opt.code} title={opt.label}>
            <input type="radio" name="icon" value={opt.code} checked={icon === opt.code} onChange={() => setIcon(opt.code)} />
            <CategoryIcon name={opt.code} size={22} />
            <span className="visually-hidden">{opt.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError errors={errors.form || errors.business} />
      <button className="btn btn--primary" disabled={busy}>
        {item ? 'Değişiklikleri kaydet' : 'Kategoriyi ekle'}
      </button>
    </form>
  )
}

function ProductForm({ item, categoryId, categories, meta, onDone }) {
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [allergens, setAllergens] = useState(item?.allergens || [])
  const [dietary, setDietary] = useState(item?.dietary || [])
  const [preview, setPreview] = useState(item?.image || null)
  const [removeImage, setRemoveImage] = useState(false)
  const toggle = (list, set, code) => set(list.includes(code) ? list.filter((c) => c !== code) : [...list, code])

  async function submit(e) {
    e.preventDefault()
    const raw = new FormData(e.currentTarget)
    const body = new FormData()
    for (const key of ['category', 'name', 'name_en', 'description', 'description_en', 'price', 'preparation_time']) {
      body.append(key, raw.get(key) ?? '')
    }
    body.append('is_active', raw.get('is_active') ? 'true' : 'false')
    body.append('is_popular', raw.get('is_popular') ? 'true' : 'false')
    body.append('allergens', JSON.stringify(allergens))
    body.append('dietary', JSON.stringify(dietary))
    const ingredients = String(raw.get('ingredients') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    body.append('ingredients', JSON.stringify(ingredients))
    const file = raw.get('image')
    if (file && file.size) body.append('image', file)
    if (!item) {
      const siblings = categories.find((c) => c.id === Number(raw.get('category')))?.products || []
      body.append('position', String(siblings.length))
    }

    setBusy(true)
    setErrors({})
    try {
      const saved = await api(item ? `/products/${item.id}/` : '/products/', { method: item ? 'PATCH' : 'POST', body })
      if (removeImage && !(file && file.size)) await api(`/products/${saved.id}/`, { method: 'PATCH', body: { image: null } })
      onDone(item ? 'Ürün güncellendi' : 'Ürün eklendi')
    } catch (err) {
      setErrors(Object.keys(err.fieldErrors).length ? err.fieldErrors : { form: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Ad</span>
          <input name="name" required maxLength={100} defaultValue={item?.name} aria-invalid={!!errors.name} />
          <FieldError errors={errors.name} />
        </label>
        <label className="field">
          <span>İngilizce ad</span>
          <input name="name_en" maxLength={100} defaultValue={item?.name_en} lang="en" />
        </label>
        <label className="field">
          <span>Açıklama</span>
          <textarea name="description" rows={2} defaultValue={item?.description} />
        </label>
        <label className="field">
          <span>İngilizce açıklama</span>
          <textarea name="description_en" rows={2} defaultValue={item?.description_en} lang="en" />
        </label>
        <label className="field">
          <span>Fiyat (₺)</span>
          <input
            name="price"
            required
            inputMode="decimal"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            defaultValue={item?.price}
            aria-invalid={!!errors.price}
            onInput={(e) => (e.currentTarget.value = e.currentTarget.value.replace(',', '.'))}
          />
          <FieldError errors={errors.price} />
        </label>
        <label className="field">
          <span>Kategori</span>
          <select name="category" defaultValue={item?.category ?? categoryId}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors.category} />
        </label>
        <label className="field">
          <span>Hazırlık süresi (dk)</span>
          <input name="preparation_time" type="number" min={0} max={240} defaultValue={item?.preparation_time ?? 0} />
        </label>
        <label className="field">
          <span>İçindekiler (virgülle ayırın)</span>
          <input name="ingredients" defaultValue={item?.ingredients?.join(', ')} placeholder="kırmızı mercimek, soğan, havuç" />
        </label>
      </div>

      <div className="checks">
        <label className="check">
          <input type="checkbox" name="is_active" defaultChecked={item ? item.is_active : true} /> Menüde göster
        </label>
        <label className="check">
          <input type="checkbox" name="is_popular" defaultChecked={item?.is_popular} /> “Sevilen” etiketi
        </label>
      </div>

      <fieldset className="tag-picker">
        <legend>Beslenme</legend>
        {meta?.dietary.map((d) => (
          <label key={d.code} className="tag-option">
            <input type="checkbox" checked={dietary.includes(d.code)} onChange={() => toggle(dietary, setDietary, d.code)} />
            <span>{d.tr}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="tag-picker">
        <legend>Alerjenler</legend>
        {meta?.allergens.map((a) => (
          <label key={a.code} className="tag-option">
            <input type="checkbox" checked={allergens.includes(a.code)} onChange={() => toggle(allergens, setAllergens, a.code)} />
            <span>{a.tr}</span>
          </label>
        ))}
        <FieldError errors={errors.allergens} />
      </fieldset>

      <div className="image-field">
        {preview && !removeImage && <img src={preview} alt="" className="image-field__preview" />}
        <label className="field">
          <span>Görsel (JPEG, PNG ya da WEBP, en fazla 2 MB)</span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files[0]
              setRemoveImage(false)
              setPreview(f ? URL.createObjectURL(f) : item?.image || null)
            }}
          />
          <FieldError errors={errors.image} />
        </label>
        {item?.image && (
          <label className="check">
            <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> Görseli kaldır
          </label>
        )}
      </div>

      <FieldError errors={errors.form} />
      <button className="btn btn--primary" disabled={busy}>
        {busy ? 'Kaydediliyor…' : item ? 'Değişiklikleri kaydet' : 'Ürünü ekle'}
      </button>
    </form>
  )
}
