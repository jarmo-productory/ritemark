/**
 * Google API Global Type Definitions
 * Merges OAuth2 (Google Identity Services) and Picker API types
 */

declare global {
  /**
   * Google Identity Services (GIS) Token Response
   */
  interface TokenResponse {
    access_token?: string
    expires_in?: number
    scope?: string
    token_type?: string
    error?: string
    error_description?: string
  }

  /**
   * Picker Builder Type
   */
  interface PickerBuilderType {
    addView(view: DocsViewType): PickerBuilderType
    setOAuthToken(token: string): PickerBuilderType
    setCallback(callback: (data: PickerCallbackData) => void): PickerBuilderType
    setTitle(title: string): PickerBuilderType
    setOrigin(origin: string): PickerBuilderType
    enableFeature(feature: string): PickerBuilderType
    disableFeature(feature: string): PickerBuilderType
    setAppId(appId: string): PickerBuilderType
    setDeveloperKey(key: string): PickerBuilderType
    setMaxItems(maxItems: number): PickerBuilderType
    build(): PickerType
  }

  /**
   * Picker Instance Type
   */
  interface PickerType {
    setVisible(visible: boolean): void
    dispose(): void
  }

  /**
   * Docs View Type
   */
  interface DocsViewType {
    setMimeTypes(mimeTypes: string): DocsViewType
    setMode(mode: string): DocsViewType
    setParent(parentId: string): DocsViewType
    setIncludeFolders(include: boolean): DocsViewType
    setSelectFolderEnabled(enabled: boolean): DocsViewType
    setOwnedByMe(ownedByMe: boolean): DocsViewType
    setStarred(starred: boolean): DocsViewType
  }

  /**
   * Picker Callback Data
   */
  interface PickerCallbackData {
    action: string
    docs?: PickerDocumentType[]
  }

  /**
   * Picker Document Type (used by pickerManager)
   */
  interface PickerDocumentType {
    id: string
    name: string
    mimeType: string
    description?: string
    type?: string
    url?: string
    iconUrl?: string
    lastEditedUtc?: number
    parentId?: string
    serviceId?: string
    sizeBytes?: number
  }

  /**
   * Window augmentation for Google APIs
   * Merges OAuth2 and Picker namespaces
   */
  interface Window {
    gapi?: {
      load: (api: string, options: { callback: () => void }) => void
    }
    google?: {
      // OAuth2 namespace (Google Identity Services)
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
          }) => {
            requestAccessToken: () => void
          }
        }
      }
      // Picker API namespace
      picker: {
        PickerBuilder: new () => PickerBuilderType
        DocsView: new (viewId: string) => DocsViewType
        ViewId: {
          DOCS: string
        }
        DocsViewMode: {
          LIST: string
        }
        Action: {
          PICKED: string
          CANCEL: string
        }
        Feature: {
          NAV_HIDDEN: string
          MINE_ONLY: string
          MULTISELECT_ENABLED: string
          SUPPORT_DRIVES: string
        }
      }
    }
  }
}

export {}
