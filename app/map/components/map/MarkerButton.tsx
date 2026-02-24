import { Map, MapPin } from "lucide-react"

const MarkerButton = ({ onClick, isActive }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      title={isActive ? "Add Pins" : "Navigate"}
      className={`p-2.5 border border-border cursor-pointer transition-all duration-300 hover:bg-foreground hover:text-background ${isActive ? 'bg-foreground text-background' : 'bg-transparent'}`}
    >
      {isActive ? <MapPin size={25} /> : <Map size={25} />}
    </button>
  )
}

export default MarkerButton
