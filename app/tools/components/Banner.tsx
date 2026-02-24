export default function Banner({ image, children }) {
  return (
    <div
      className="flex bg-cover bg-center bg-no-repeat rounded-lg w-full h-[20dvh] p-4 justify-center items-center relative"
      style={{
        backgroundImage: `url(${image})`
      }}
    >
      <div className="absolute inset-0 bg-black/40 rounded-lg" />
      <div className="z-10">
        {children}
      </div>
    </div>
  )
}
