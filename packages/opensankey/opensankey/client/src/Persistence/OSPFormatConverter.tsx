// ==================================================================================================
// OSP Format Converter
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Convertisseur pour migrer les attributs de l'ancien format OSP vers le nouveau format unifié
// ==================================================================================================

import { Type_JSON } from '../types/Utils'

/**
 * Convertit un objet JSON du format OSP vers le nouveau format unifié
 */
export class OSPFormatConverter {
  
  /**
   * Mapping des anciens noms d'attributs OSP vers les nouveaux noms
   */
  private static readonly OSP_ATTRIBUTE_MAPPING = {
    // Icon attributes
    'iconName': 'icon_name',
    'iconColor': 'icon_color',
    'iconVisible': 'icon_visible',
    'iconViewBox': 'icon_view_box',
    'iconColorSustainable': 'icon_color_sustainable',
    
    // Foreign Object attributes
    'has_FO': 'has_fo',
    'is_FO_raw': 'is_fo_raw',
    'FO_content': 'fo_content',
    
    // Image attributes
    'is_image': 'is_image',
    'image_src': 'image_src',
    
    // Hyperlink attribute
    'hyperlink': 'hyperlink'
  } as const



  /**
   * Convertit un node JSON de l'ancien format OSP vers le nouveau format
   * @param json_object - L'objet JSON à convertir
   * @returns L'objet JSON converti avec les attributs dans 'local'
   */
  public static convertNodeFromOSPFormat(json_object: Type_JSON): Type_JSON {
    const converted = { ...json_object }
    
    // Initialise l'objet local s'il n'existe pas
    if (!converted.local) {
      converted.local = {}
    }

    // Convertit chaque attribut OSP de la racine vers local avec le nouveau nom
    Object.entries(this.OSP_ATTRIBUTE_MAPPING).forEach(([oldKey, newKey]) => {
      if (converted[oldKey] !== undefined) {
        // Déplace l'attribut vers local avec le nouveau nom
        //@ts-expect-error xxx
        converted.local[newKey] = converted[oldKey]
        // Supprime l'ancien attribut de la racine
        delete converted[oldKey]
      }
    })

    return converted
  }

  /**
   * Vérifie si un objet JSON utilise l'ancien format OSP
   * @param json_object - L'objet JSON à vérifier
   * @returns true si l'objet utilise l'ancien format OSP
   */
  public static isOSPFormat(json_object: Type_JSON): boolean {
    return Object.keys(this.OSP_ATTRIBUTE_MAPPING).some(oldKey => 
      json_object[oldKey] !== undefined
    )
  }

  /**
   * Convertit un array de nodes JSON de l'ancien format OSP vers le nouveau format
   * @param nodes_array - L'array de nodes JSON à convertir
   * @returns L'array de nodes JSON convertis
   */
  public static convertNodesArrayFromOSPFormat(nodes_array: Type_JSON[]): Type_JSON[] {
    return nodes_array.map(node => this.convertNodeFromOSPFormat(node))
  }

  /**
   * Convertit un objet JSON complet (sankey) contenant des nodes OSP
   * @param sankey_json - L'objet JSON du sankey à convertir
   * @returns L'objet JSON du sankey converti
   */
  public static convertSankeyFromOSPFormat(sankey_json: Type_JSON): Type_JSON {
    const converted = { ...sankey_json }

    // Convertit les nodes si elles existent
    if (converted.nodes && Array.isArray(converted.nodes)) {
      //@ts-expect-error xxx
      converted.nodes = this.convertNodesArrayFromOSPFormat(converted.nodes)
    }

    return converted
  }

  /**
   * Effectue une conversion automatique si nécessaire
   * @param json_object - L'objet JSON à convertir si nécessaire
   * @returns L'objet JSON converti ou original
   */
  public static autoConvertIfNeeded(json_object: Type_JSON): Type_JSON {
    if (this.isOSPFormat(json_object)) {
      console.log('Ancien format OSP détecté, conversion en cours...')
      return this.convertNodeFromOSPFormat(json_object)
    }
    return json_object
  }

  /**
   * Log les attributs OSP trouvés dans un objet JSON (pour debug)
   * @param json_object - L'objet JSON à analyser
   * @param label - Label pour identifier l'objet dans les logs
   */
  public static logOSPAttributesFound(json_object: Type_JSON, label: string = 'Object'): void {
    const foundAttributes = Object.keys(this.OSP_ATTRIBUTE_MAPPING).filter(oldKey => 
      json_object[oldKey] !== undefined
    )

    if (foundAttributes.length > 0) {
      console.log(`${label} - Attributs OSP trouvés:`, foundAttributes)
      foundAttributes.forEach(attr => {
        console.log(`  ${attr}: ${json_object[attr]}`)
      })
    }
  }

  /**
   * Crée un rapport de conversion
   * @param original - L'objet JSON original
   * @param converted - L'objet JSON converti
   * @returns Un rapport de conversion
   */
  public static createConversionReport(original: Type_JSON, /*converted: Type_JSON*/): {
    converted_attributes: string[],
    moved_to_local: string[],
    unchanged_attributes: string[]
  } {
    const converted_attributes: string[] = []
    const moved_to_local: string[] = []
    const unchanged_attributes = Object.keys(original).filter(key => 
      !Object.keys(this.OSP_ATTRIBUTE_MAPPING).includes(key)
    )

    Object.entries(this.OSP_ATTRIBUTE_MAPPING).forEach(([oldKey, newKey]) => {
      if (original[oldKey] !== undefined) {
        converted_attributes.push(`${oldKey} → ${newKey}`)
        moved_to_local.push(newKey)
      }
    })

    return {
      converted_attributes,
      moved_to_local,
      unchanged_attributes
    }
  }
}

/**
 * Fonction utilitaire pour convertir rapidement un node OSP
 * @param node_json - Le node JSON à convertir
 * @returns Le node JSON converti
 */
export function convertOSPNode(node_json: Type_JSON): Type_JSON {
  return OSPFormatConverter.convertNodeFromOSPFormat(node_json)
}

/**
 * Fonction utilitaire pour convertir rapidement un sankey OSP
 * @param sankey_json - Le sankey JSON à convertir
 * @returns Le sankey JSON converti
 */
export function convertOSPSankey(sankey_json: Type_JSON): Type_JSON {
  return OSPFormatConverter.convertSankeyFromOSPFormat(sankey_json)
}

/**
 * Fonction utilitaire pour détecter et convertir automatiquement
 * @param json_object - L'objet JSON à convertir si nécessaire
 * @returns L'objet JSON converti ou original
 */
export function autoConvertOSP(json_object: Type_JSON): Type_JSON {
  return OSPFormatConverter.autoConvertIfNeeded(json_object)
}