import dynamic from 'next/dynamic'

const ClientIcon = dynamic(() =>
    import('@fortawesome/react-fontawesome').then((mod) => mod.FontAwesomeIcon),
    { ssr: false }
)

export default ClientIcon
