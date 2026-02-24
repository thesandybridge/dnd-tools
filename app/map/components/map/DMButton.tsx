import { Wand2 } from "lucide-react"

const DMButton = ({ onClick, isActive }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      title="DM Map"
      className={`p-2.5 border border-border cursor-pointer transition-all duration-300 hover:bg-foreground hover:text-background ${isActive ? 'bg-foreground text-background' : 'bg-transparent'}`}
    >
      <Wand2 size={25} />
    </button>
  )
}

export default DMButton
