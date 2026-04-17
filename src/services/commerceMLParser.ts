import { XMLParser } from 'fast-xml-parser';

export class CommerceMLParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseTagValue: true,
    });
  }

  parse(xmlData: string) {
    return this.parser.parse(xmlData);
  }
}
