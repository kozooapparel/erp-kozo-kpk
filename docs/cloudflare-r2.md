# Cloudflare R2 storage

The application keeps each tenant's R2 credentials encrypted in Supabase and uses them only from Node.js server routes. Never place a tenant access key in a `NEXT_PUBLIC_*` variable.

## Required application environment variable

```env
# Generate once with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
R2_CREDENTIAL_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
```

Keep this value only in the deployment secret manager and local `.env.local`. Changing it makes previously saved tenant credentials unreadable; rotate credentials and reconnect each affected tenant if that happens.

## Cloudflare setup per tenant

1. In the tenant's Cloudflare account, create a private R2 bucket.
2. Create an R2 API token scoped only to that bucket. Grant **Object Read**, **Object Write**, and **List** (the last is required for the connection check); do not use an account-wide token.
3. Create the matching S3 API access key and secret for that token.
4. Open **Settings → Storage** as an owner and enter the Account ID, bucket, access key, secret, and endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. An optional storage limit in GB enables an accurate capacity progress bar; Cloudflare's S3 API does not otherwise publish a bucket quota.
5. Test and save the connection. The access key and secret are discarded from the browser after saving and are never returned by the API.

All objects are private. Uploads use multipart presigned part URLs (10 MiB chunks) so files larger than 50 MiB bypass Next.js request-body limits. Downloads use a five-minute signed URL.

## Browser upload CORS

Because multipart parts are uploaded directly from the browser to R2, add the application origin to the bucket CORS configuration. Allow `PUT`, expose the `ETag` response header, and allow the headers used by the signed request. Keep the bucket private; this CORS rule does not make objects public.

The future Proses Layout integration should call `/api/storage/uploads/initiate`, upload each chunk to the returned presigned part URL, then call `part-url`/`complete`. It must pass the selected order's `brandId` and `orderId`; the API rejects cross-tenant or mismatched brand/order pairs.
