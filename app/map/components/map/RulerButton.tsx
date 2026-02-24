import { Ruler } from "lucide-react"

const RulerButton = ({ onClick, isActive }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      title="Ruler"
      className={`p-2.5 border border-border cursor-pointer transition-all duration-300 hover:bg-foreground hover:text-background ${isActive ? 'bg-foreground text-background' : 'bg-transparent'}`}
    >
      <Ruler size={25} />
    </button>
  )
}

export default RulerButton
