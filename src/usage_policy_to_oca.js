export function usagePolicyToOca(usagePolicy) {
    const oca = []
    const schemaBase = {
      "issued_by": "",
      "name": "Usage Policy",
      "pii_attributes": [],
      "description": "",
      "attributes": {},
      "type": "spec/schema_base/1.0",
      "classification": "",
      "@context": "https://odca.tech/v1"
    }
    const labelOverlay = {
      "@context": "https://odca.tech/overlays/v1",
      "type": "spec/overlay/label/1.0",
      "issued_by": "",
      "role": "",
      "purpose": "",
      "schema_base": "hl:awK5biKd3MPUroUmZ1igsmPtJ8yimYxsb8ht4QxP3raz",
      "language": "en_US",
      "attr_labels": {},
      "attr_categories": [
        "_cat-1_"
      ],
      "cat_labels": {
        "_cat-1_": ""
      },
      "cat_attributes": {
        "_cat-1_": []
      }
    }
    const encodingOverlay = {
      "@context": "https://odca.tech/overlays/v1",
      "type": "spec/overlay/character_encoding/1.0",
      "issued_by": "",
      "role": "",
      "purpose": "",
      "schema_base": "hl:awK5biKd3MPUroUmZ1igsmPtJ8yimYxsb8ht4QxP3raz",
      "default_character_encoding": "utf-8",
      "attr_character_encoding": {}
    }

    Object.entries(usagePolicy).forEach(([attr_name, attr]) => {
      schemaBase.attributes[attr_name] = "Text"
      labelOverlay.attr_labels[attr_name] = attr[0].value
      labelOverlay.cat_attributes['_cat-1_'].push(attr_name)
      encodingOverlay.attr_character_encoding[attr_name] = "utf-8"
    })

    oca.push(schemaBase)
    oca.push(labelOverlay)
    oca.push(encodingOverlay)

    return oca
}
