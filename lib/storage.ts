import { AwsClient } from "aws4fetch"

let client: AwsClient | null = null

function getClient() {
  if (!client) {
    client = new AwsClient({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    })
  }
  return client
}

export async function fetchFromStorage(key: string) {
  const url = `${process.env.STORAGE_URL}/${key}`
  return getClient().fetch(url)
}
