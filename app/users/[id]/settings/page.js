import ColorPickerComponent from "../components/settings/ColorPicker"

export default function Settings({ params }) {
  return (
    <ColorPickerComponent userId={params.id}/>
  )
}
