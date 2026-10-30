import {
  Beef, Beer, CakeSlice, Citrus, Coffee, Croissant, CupSoda, Drumstick, EggFried, Fish,
  IceCreamCone, Leaf, Pizza, Salad, Sandwich, Soup, Utensils, Wine,
} from 'lucide-react'

const ICONS = {
  utensils: Utensils, breakfast: EggFried, soup: Soup, salad: Salad, sandwich: Sandwich,
  pizza: Pizza, meat: Beef, chicken: Drumstick, fish: Fish, bakery: Croissant,
  dessert: CakeSlice, icecream: IceCreamCone, coffee: Coffee, tea: Leaf,
  cold_drink: CupSoda, juice: Citrus, wine: Wine, beer: Beer,
}

export default function CategoryIcon({ name, ...props }) {
  const Icon = ICONS[name] || Utensils
  return <Icon aria-hidden="true" {...props} />
}
