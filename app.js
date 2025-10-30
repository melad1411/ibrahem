// Helper: تحويل قيمة إلى نص آمن للعرض
function valueToString(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    // نحويل الكائن/المصفوفة إلى JSON مختصر (لتجنب طباعة [object Object])
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }
  return String(v);
}

// جمع كل المفاتيح (headers) من كل عنصر داخل المصفوفة
function getHeaders(dataArray) {
  const headersSet = new Set();
  dataArray.forEach((obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((k) => headersSet.add(k));
    }
  });
  return Array.from(headersSet);
}

// بناء الجدول ديناميكياً
function buildTable(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // تفريغ الحاوية

  if (!data || (Array.isArray(data) && data.length === 0)) {
    const msg = document.createElement("div");
    msg.className = "no-data";
    msg.textContent = "لا يوجد مواد تطابق البحث.";
    container.appendChild(msg);
    return;
  }

  // إذا JSON هو كائن مفرد، نحول إلى مصفوفة من عنصر واحد
  const rows = Array.isArray(data) ? data : [data];

  const headers = getHeaders(rows);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  // إضافة رؤوس الأعمدة مع إمكانية الفرز عند الضغط
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.dataset.key = h;
    th.addEventListener("click", () => {
      // تبديل حالة الفرز (asc / desc / none)
      const current = th.dataset.sort || "none";
      // إزالة صفات الفرز من جميع الرؤوس
      thead.querySelectorAll("th").forEach((t) => {
        t.dataset.sort = "";
        t.classList.remove("sort-asc", "sort-desc");
      });
      let next;
      if (current === "none" || current === "") next = "asc";
      else if (current === "asc") next = "desc";
      else next = "none";

      if (next === "none") {
        // إعادة عرض بدون فرز (الترتيب الأصلي)
        renderBody(rows, table, headers);
      } else {
        th.dataset.sort = next;
        th.classList.add(next === "asc" ? "sort-asc" : "sort-desc");
        sortAndRender(rows, headers, h, next === "asc", table);
      }
    });
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);

  container.appendChild(table);

  // أول عرض للجسم
  renderBody(rows, table, headers);

  // ----- دوال مساعدة داخل buildTable -----
  function renderBody(dataRows, tableEl, headersList) {
    const tb = tableEl.querySelector("tbody");
    tb.innerHTML = "";
    const frag = document.createDocumentFragment();
    dataRows.forEach((rowObj) => {
      const tr = document.createElement("tr");
      headersList.forEach((h) => {
        const td = document.createElement("td");
        td.textContent = valueToString(rowObj ? rowObj[h] : "");
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });
    tb.appendChild(frag);
  }

  function sortAndRender(dataRows, headersList, key, asc, tableEl) {
    // نعمل نسخة حتى لا نغيّر الترتيب الأصلي إن احتجنا له
    const copy = dataRows.slice();
    copy.sort((a, b) => {
      const va = a && a[key] !== undefined && a[key] !== null ? a[key] : "";
      const vb = b && b[key] !== undefined && b[key] !== null ? b[key] : "";
      // مقارنة رقمية إذا كان كلاهما رقمياً
      const na = Number(va);
      const nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb)) {
        return asc ? na - nb : nb - na;
      }
      // مقارنة نصية محايدة لحالة الحروف
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return asc ? -1 : 1;
      if (sa > sb) return asc ? 1 : -1;
      return 0;
    });
    renderBody(copy, tableEl, headersList);
  }
}

// قراءة ملف JSON محلي وبناء الجدول
fetch("./data.json")
  .then((resp) => {
    if (!resp.ok) throw new Error("فشل تحميل ملف JSON");
    return resp.json();
  })
  .then((jsonData) => {
    filtering(jsonData);
  })
  .catch((err) => {
    const c = document.getElementById("table-container");
    c.innerHTML = '<div class="no-data">خطأ: ' + err.message + "</div>";
    console.error(err);
  });

function filtering(jsonData) {
  //filter of jsonData
  console.log("type of (jsonData): " + typeof jsonData);
  // console.log("details of (jsonData): \n" + JSON.stringify(jsonData));
  console.log(jsonData[0]["اسم المادة"]);

  const textBox = document.querySelector("input.search");
  textBox.addEventListener("input", () => {
    const filtered_jsonData = jsonData.filter((item) => {
      let arr = textBox.value.split(" ");
      for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (
          !(
            /^\s*$/.test(element) ||
            element == null ||
            element == undefined ||
            element == ""
          )
        ) {
          if (item["اسم المادة"].includes(element.trim())) {
            if (i == arr.length - 1) {
              return true;
            }
            continue;
          } else {
            return false;
          }
        } else if (i != arr.length - 1) {
          continue;
        } else {
          return true;
        }
      }
    });

    console.log(textBox.value.split(" "));
    console.log(filtered_jsonData);
    buildTable(filtered_jsonData, "table-container");
  });
  //
}
