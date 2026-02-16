import ColorPickerComponent from "../components/settings/ColorPicker"

export default async function Settings({ params }) {
  const { id } = await params
  return (
    <ColorPickerComponent userId={id}/>
  )
}
