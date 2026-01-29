# Changelog

## Bundled Label Images Feature

### Summary

Changed the verification flow from requiring manual image uploads to automatically loading bundled label images from the mock application database. The previous flow was "Select App > Upload Image > Verify". The new flow is "Select App > [auto-loads bundled image] > Verify". Manual upload is still supported as an override for existing applications and as the primary path for manual entry.

### Files Modified

#### 1. `lib/mock-cola-database.ts`

- Reduced the mock database from 39 applications to 4 representative records covering all 3 product types
- Added `label_image_url` field to each application, pointing to `/test-labels/{id}.png`
- The 4 retained applications:
  - `COL-2024-78432` -- Old Tom Distillery, Kentucky Straight Bourbon Whiskey (spirits)
  - `COL-2024-78434` -- Sunset Valley, Chardonnay (wine, has vintage/appellation)
  - `COL-2024-78438` -- Mountain Peak, Golden Ale (malt_beverage)
  - `COL-2024-78440` -- Heritage, Rye Whiskey (spirits, has container_markings/Box 15)

#### 2. `app/verify/page.tsx`

Rewrote the verify page to support three image source paths:

- **Existing app with bundled image (default path):** Selecting an app from the dropdown auto-displays its bundled image via `ImageViewer`. The "Verify Label" button is immediately available without uploading anything.
- **Override upload:** A "Upload different image" ghost button below the auto-loaded image expands an `UploadZone`. If the user uploads a file, it replaces the bundled image for verification. A "Clear override" button reverts to the bundled image.
- **Manual entry:** The `UploadZone` is always shown since manual entries have no bundled image.

New state variables:
- `bundledImageUrl` -- set from `app.label_image_url` on selection
- `overrideFile` / `overridePreview` -- set when user uploads via the override zone
- `manualFile` / `manualPreview` -- set from manual entry or direct upload
- `showOverrideUpload` -- controls visibility of the override upload zone

Image resolution priority in `handleVerify`:
1. `overrideFile` (uploaded override takes precedence)
2. `manualFile` (manual entry or fallback upload)
3. `bundledImageUrl` (fetched from public URL, converted to base64)

#### 3. `components/application-lookup.tsx`

- Added an `UploadZone` to the manual entry form so users can attach a label image alongside the application data
- Expanded the `onApplicationLoaded` callback signature to accept an optional second parameter: `onApplicationLoaded(app: ApplicationData, manualImageFile?: File)`
- New state: `manualImageFile` tracks the file selected in the manual entry form
- The file is passed back to the parent (verify page) on form submission via the expanded callback

#### 4. `app/batch/page.tsx`

- Added a mode toggle between "Select Applications" and "Upload Images"
- **Select Applications mode (default):** Users pick applications from a grouped dropdown (same style as ApplicationLookup). Selected apps are listed with remove buttons. Processing fetches each app's bundled image, converts to base64, and sends to the batch API with the correct `application_id`.
- **Upload Images mode:** Preserved the original multi-file upload behavior. Updated the demo application ID cycling to use the 4 remaining IDs.
- Removed unused imports (`Plus`, `loadingApps`).

#### 5. `components/application-data-card.tsx`

- Added a label thumbnail section: if `label_image_url` is present on the application, a 64x64 thumbnail image is shown in a muted container above the fields table, along with the image path.

#### 6. `app/page.tsx`

- Updated the "Demo Application IDs" section on the home page to reference only the 4 remaining applications.

#### 7. `public/test-labels/`

- Created the directory where label images should be placed. Files should be named to match application IDs (e.g., `COL-2024-78432.png`).

### Type Changes

The `ApplicationData` interface in `lib/types.ts` already included the optional `label_image_url?: string` field. No type changes were needed.

### How to Test

1. Place label images in `public/test-labels/` matching the 4 application IDs:
   - `COL-2024-78432.png`
   - `COL-2024-78434.png`
   - `COL-2024-78438.png`
   - `COL-2024-78440.png`
2. `npm run dev`
3. Navigate to `/verify`:
   - Select any app from the dropdown -- bundled image auto-loads, Verify button is immediately active
   - Click "Upload different image" -- upload zone appears, upload overrides the bundled image
   - Click "Clear override" -- reverts to bundled image
   - Switch to Manual Entry -- fill fields, attach an image, submit, then verify
4. Navigate to `/batch`:
   - Default mode "Select Applications" -- pick apps from dropdown, process uses bundled images
   - Switch to "Upload Images" -- original multi-file upload behavior
5. Confirm `ApplicationDataCard` shows the label thumbnail when an app has `label_image_url`
