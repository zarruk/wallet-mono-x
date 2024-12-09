import { NextResponse } from 'next/server';

const BANKS_DATA = {
  "kind": "transfers",
  "banks": [
    {
      "code": "007",
      "id": "bank_4BgzIhjEccGpoKmWb4pRni",
      "name": "BANCOLOMBIA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "051",
      "id": "bank_6KN41Bo5vCke1DehPDX6ex",
      "name": "DAVIVIENDA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "507",
      "id": "bank_2XiCwPpcArQBccs33CHZNJ",
      "name": "NEQUI",
      "supported_account_types": [
        "savings_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "551",
      "id": "bank_66il68RtZ92oaouoe24YVQ",
      "name": "DAVIPLATA",
      "supported_account_types": [
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "001",
      "id": "bank_2XuaGAG8kiCDq23cqr9N1H",
      "name": "BANCO DE BOGOTA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "013",
      "id": "bank_3eaeVhKvGg8NkvuchGEkQo",
      "name": "BBVA",
      "supported_account_types": [
        "savings_account",
        "checking_account",
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "023",
      "id": "bank_0qpfuwjGKMda7OLtRJEUyM",
      "name": "BANCO DE OCCIDENTE",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "002",
      "id": "bank_75PAorBvkwx1seCFi5nO0Z",
      "name": "BANCO POPULAR",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "006",
      "id": "bank_3o26GZinn6H9fdwsBovFMR",
      "name": "ITAU BANCO CORPBANCA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "014",
      "id": "bank_01WpsjoSenr5sNV9O470NV",
      "name": "ITAU* HELM BANK",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "032",
      "id": "bank_60ltZpUfiUX5fDaBXCRmfL",
      "name": "BANCO CAJA SOCIAL",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "009",
      "id": "bank_6dYNDTC7oUQbQAkv44LHCM",
      "name": "BANCO CITIBANK COLOMBIA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "019",
      "id": "bank_4vnhoyd0r72nGD5eXXorvk",
      "name": "SCOTIABANK COLPATRIA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "052",
      "id": "bank_0uZC0AzCvu4e4TyuqoSAMS",
      "name": "BANCO AV VILLAS",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "062",
      "id": "bank_0HXPxr8XLKJNQArSxQZSE4",
      "name": "BANCO FALABELLA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "012",
      "id": "bank_5ABb1YExRrMsxqjUBfu6JG",
      "name": "BANCO GNB SUDAMERIS",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "065",
      "id": "bank_4eESl8723UalftJ9M370Od",
      "name": "BANCO SANTANDER DE NEGOCIOS",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "040",
      "id": "bank_3dQTEMK7E7QLz6jEbFhIei",
      "name": "BANCO AGRARIO",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "053",
      "id": "bank_1GqPGUI2ZkICBItk7oKVf4",
      "name": "BANCO W SA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "063",
      "id": "bank_7LeZpuTKXecp1HFXgBPT20",
      "name": "BANCO FINANDINA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "047",
      "id": "bank_6J2hJBeExEEVhTjHsU6nim",
      "name": "BANCO MUNDO MUJER",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "060",
      "id": "bank_7IxqxeJsnkE3UlvtNOCqci",
      "name": "BANCO PICHINCHA S.A",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "058",
      "id": "bank_4SHV7ecdx6UxeKsaS9pqUp",
      "name": "BANCO PROCREDIT",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "031",
      "id": "bank_3dpPJNSZbtoixvtMyAyfX5",
      "name": "BANCOLDEX",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "061",
      "id": "bank_32FrU8qxbk3YizW8o8SNbp",
      "name": "BANCOOMEVA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "292",
      "id": "bank_0KkXCXKROvkWXX440CKJEc",
      "name": "CONFIAR",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "066",
      "id": "bank_7Uc7LiVubfJM9W04qwpjg2",
      "name": "BANCO COOPERATIVO COOPCENTRAL",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "289",
      "id": "bank_4azp2Vl3Otzj3voTFFfF7t",
      "name": "COTRAFA ENTIDAD FINANCIERA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "283",
      "id": "bank_2iABnXGvN4PJtH2qYVpSgj",
      "name": "CFA FINANCIERA ANTIOQUIA",
      "supported_account_types": [
        "savings_account",
        "checking_account",
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "121",
      "id": "bank_27WnLUVFUCbusINnacW2vm",
      "name": "FINANCIERA JURISCOOOP CF",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "067",
      "id": "bank_3IFgh3AsBCaoZDZCZGALKw",
      "name": "MIBANCO",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "059",
      "id": "bank_7jN5cDhotJSjV7lgXwDEIh",
      "name": "BANCAMIA S.A",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "558",
      "id": "bank_4eqixjJ3kktNUwvrwdmJUR",
      "name": "BANCO CREDIFINANCIERA SA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "069",
      "id": "bank_0VMUcKpFJHVEzo7TEmGwBM",
      "name": "BANCO SERFINANZA SA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "303",
      "id": "bank_4GHRIVmGoEbhwKRb8hIYzq",
      "name": "GIROS Y FINANZAS CF",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "801",
      "id": "bank_7X9ByNSArTQjV5sqZYPARF",
      "name": "MOVII",
      "supported_account_types": [
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "370",
      "id": "bank_0kjs2yfGkSwQzWVKa3XmRy",
      "name": "COLTEFINANCIERA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "637",
      "id": "bank_4kk5pfran6wSmK6jvdpogs",
      "name": "IRIS",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "071",
      "id": "bank_7BkuaBBdgh9gaqk0ijXdwb",
      "name": "J.P. MORGAN COLOMBIA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "070",
      "id": "bank_0pIXHdokEYvSbjyLGVh7Wm",
      "name": "LULO BANK S.A.",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "805",
      "id": "bank_3xXIfqkIMQJPcvXtCTh9so",
      "name": "BANCO BGT PACTUAL",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "804",
      "id": "bank_7KDogVKDQZnWZJxSCQcxNd",
      "name": "UALA",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "151",
      "id": "bank_0vLlNzoKbIl24FfxqbSdKC",
      "name": "RAPPIPAY DAVIPLATA",
      "supported_account_types": [
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "803",
      "id": "bank_6ruq1wEex9gYPwhRaUdfVK",
      "name": "POWWI",
      "supported_account_types": [
        "savings_account",
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "560",
      "id": "bank_6KbH7S8Lgs4OP9KxurmfeE",
      "name": "PIBANK",
      "supported_account_types": [
        "savings_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "291",
      "id": "bank_2vxUmUcKHM63SH8iyft27e",
      "name": "COOFINEP",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "811",
      "id": "bank_7Yoeem72NcrVrqgAd3fzKF",
      "name": "RAPPIPAY",
      "supported_account_types": [
        "savings_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "812",
      "id": "bank_58dmODM5ZtySSiT3YiziaV",
      "name": "COINK",
      "supported_account_types": [
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "814",
      "id": "bank_2lPtIcAMA09vNUBUmUzy78",
      "name": "GLOBAL66",
      "supported_account_types": [
        "electronic_deposit"
      ],
      "supports_turbo": true
    },
    {
      "code": "808",
      "id": "bank_0W01GlgtXtmAUR2jq3I0y0",
      "name": "BOLD CF",
      "supported_account_types": [
        "savings_account"
      ],
      "supports_turbo": true
    },
    {
      "code": "813",
      "id": "bank_1IHHlmt4nYQLiCYxmxRVZ4",
      "name": "SANTANDER CONSUMER",
      "supported_account_types": [
        "savings_account",
        "checking_account"
      ],
      "supports_turbo": true
    }
  ]
};

export async function GET() {
  try {
    return NextResponse.json(BANKS_DATA);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener los bancos' },
      { status: 500 }
    );
  }
} 