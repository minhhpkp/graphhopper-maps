const isTesting = false;

function contain(str, subStr) {
  return str.toLowerCase().search(subStr) != -1;
}

function containKeyword(keywords, field) {
  for (const keyword of keywords) {
    if (typeof field === "string") {
      if (contain(field, keyword)) {
        if (isTesting) console.log(field);
        return true;
      }
    } else if (Array.isArray(field)) {
      for (const lv1 of field) {
        if (typeof lv1 === "string" && contain(lv1, keyword)) {
          if (isTesting) console.log(lv1);
          return true;
        } else if (Array.isArray(lv1)) {
          for (const lv2 of lv1) {
            if (typeof lv2 === "string" && contain(lv2, keyword)) {
              if (isTesting) console.log(lv2);
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

export default function isPoi(data, keywords) {
  return (
    containKeyword(keywords, data.vi_title) ||
    containKeyword(keywords, data.en_title) ||
    containKeyword(keywords, data.vi_business) ||
    containKeyword(keywords, data.en_business) ||
    containKeyword(keywords, data.webSite) ||
    containKeyword(keywords, data.about) ||
    containKeyword(keywords, data.description_1) ||
    containKeyword(keywords, data.description_2)
  );
}
