import { downloadFromS3 } from './src/services/s3Service.js';
import { CommerceMLParser } from './src/services/commerceMLParser.js';

async function getPriceTypes() {
  const parser = new CommerceMLParser();
  const offersXml = await downloadFromS3('1C/offers.xml');
  const offersData = parser.parse(offersXml);
  const types = offersData?.КоммерческаяИнформация?.ПакетПредложений?.ТипыЦен?.ТипЦены || [];
  console.log(JSON.stringify(types, null, 2));
}

getPriceTypes();
