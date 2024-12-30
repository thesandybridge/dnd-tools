import { Marker, fetchMarkers } from "@/lib/markers";
import { UseQueryResult, useQuery } from "@tanstack/react-query";

const useGetMarkers = (): UseQueryResult<Marker[]> => useQuery({
  queryKey: ['markers'],
  queryFn: fetchMarkers,
})

export default useGetMarkers
