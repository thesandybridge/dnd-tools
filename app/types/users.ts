import { UUID } from "../../utils/types";

export interface User {
  id: UUID,
  name: string,
  email: string,
  image: string,
  color: string,
}
