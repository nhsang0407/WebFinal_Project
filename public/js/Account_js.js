// ===============================
// Chuyển tab bằng data-target
// ===============================
const menuItems = document.querySelectorAll('.account_sidebar li[data-target]');
const tabs = document.querySelectorAll('.tab_content');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
    // Bỏ active cũ
    menuItems.forEach(i => i.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));

    // Kích hoạt mới
    item.classList.add('active');
    const target = item.getAttribute('data-target');
    document.getElementById(target).classList.add('active');
});
});
// Kiểm tra hash từ URL khi load trang
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const targetMenu = document.querySelector(`.account_sidebar li[data-target="${hash}"]`);
    const targetTab = document.getElementById(hash);

    if (targetMenu && targetTab) {
        menuItems.forEach(i => i.classList.remove('active'));
        tabs.forEach(tab => tab.classList.remove('active'));

        targetMenu.classList.add('active');
        targetTab.classList.add('active');
    }
});
// Mở trang orders từ xem đơn hàng của tôi trong header
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#orders') {
    const ordersTabMenu = document.querySelector('.account_sidebar li[data-target="orders"]');
    const ordersContent = document.querySelector('#orders');

    if (ordersTabMenu && ordersContent) {
      // Bỏ class active ở các tab khác
      document.querySelectorAll('.account_sidebar li').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab_content').forEach(content => content.classList.remove('active'));

      // Kích hoạt tab địa chỉ
      ordersTabMenu.classList.add('active');
      ordersContent.classList.add('active');
    }
  }
});
// ===============================
// Hiện thông tin user từ DB
// ===============================
async function loadUserInfo() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/userinfo`, {
            credentials: "include"
        });
        if (!res.ok) throw new Error("Cannot fetch user info");

        const data = await res.json();
        const user = data.user;

        // Fill thông tin
        document.querySelectorAll(".fullNameView").forEach(el => el.textContent = user.full_name || '');
        document.querySelector(".emailView").textContent = user.email || '';
        document.querySelectorAll(".phoneView").forEach(el => el.textContent = user.phone || '');
        document.querySelectorAll(".addressView").forEach(el => el.textContent = user.address || '');

        // Fill form edit
        if(user.full_name){
            const names = user.full_name.split(" ");
            document.getElementById("firstName").value = names.slice(0, -1).join(" ") || '';
            document.getElementById("lastName").value = names.slice(-1)[0] || '';
        }
        document.getElementById("email").value = user.email || '';
        document.getElementById("phone").value = user.phone || '';
        document.getElementById("address_acc").value = user.address || '';
        
        // Thêm địa chỉ vào tab danh sách
        const addressContainer = document.getElementById('address');
        const btnAdd = document.querySelector('.btn_add_address');

        if(user.addresses?.length){
            // Bỏ default cũ trước khi thêm từ DB
            addressContainer.querySelectorAll('.address_card.default').forEach(card => {
                card.classList.remove('default');
                const tag = card.querySelector('.default_tag');
                if(tag) tag.style.display = 'none';
                const cb = card.querySelector('.defaultCheckbox');
                if(cb) cb.checked = false;
            });
            user.addresses.forEach(addr => {
                // Kiểm tra xem địa chỉ này đã có trong DOM chưa
                const existingCard = Array.from(addressContainer.querySelectorAll('.address_card')).find(card => {
                    const cardName = card.querySelector('.address_name').textContent.trim();
                    const cardPhone = card.querySelector('.address_info p:nth-child(1)').textContent.replace('Số điện thoại:', '').trim();
                    const cardAddress = card.querySelector('.address_info p:nth-child(2)').textContent.replace('Địa chỉ:', '').trim();
                    
                    return cardName === addr.name && cardPhone === addr.phone && cardAddress === addr.address_text;
                });

                // Nếu có thì xóa để thay bằng bản DB mới
                if(existingCard) existingCard.remove();

                // Thêm card mới từ DB
                const newCard = document.createElement('div');
                newCard.classList.add('address_card');
                if(addr.is_default) newCard.classList.add('default');

                newCard.innerHTML = `
                  <div class="address_name">${addr.name}</div>
                  <div class="address_info">
                      <p><strong>Số điện thoại:</strong> ${addr.phone}</p>
                      <p><strong>Địa chỉ:</strong> ${addr.address_text}</p>
                      <span class="default_tag" style="${addr.is_default ? '' : 'display:none;'}">Địa chỉ mặc định</span>
                  </div>
                  <div class="address_actions">
                      <label><input type="checkbox" class="defaultCheckbox" ${addr.is_default ? 'checked' : ''}> Làm mặc định</label>
                      <i class="fa-solid fa-pen-to-square"></i>
                      <i class="fa-solid fa-xmark"></i>
                  </div>
                `;

                attachCardEvents(newCard);
                addressContainer.insertBefore(newCard, btnAdd);
                // === Lưu vào selectedAddress nếu là mặc định ===
                if (addr.is_default) {
                    const selectedAddr = {
                        name: addr.name,
                        phone: addr.phone,
                        address: addr.address_text,
                        default: true
                    };
                    localStorage.setItem('selectedAddress', JSON.stringify(selectedAddr));
                }
            });
        }

    } catch (err) {
        console.error("Error loading user info:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadUserInfo);


// ===============================
// Chỉnh ảnh
// ===============================
const avatarImg = document.querySelector('.profile_info img');
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const avatarInput = document.getElementById('avatarInput');

// --- Khi trang tải, hiển thị lại ảnh đã lưu ---
const savedAvatar = localStorage.getItem('userAvatar');
if (savedAvatar) {
    avatarImg.src = savedAvatar; // hiển thị ảnh đã lưu
}

// --- Khi nhấn nút "Cập nhật ảnh" ---
uploadAvatarBtn.addEventListener('click', () => {
    avatarInput.click(); // mở hộp chọn file
});

// --- Khi người dùng chọn ảnh ---
avatarInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;

        // Cập nhật ảnh hiển thị
        avatarImg.src = imageData;

        // Lưu ảnh vào localStorage
        localStorage.setItem('userAvatar', imageData);
    };
    reader.readAsDataURL(file); // đọc file thành dạng base64
});

// ===============================
// Chuyển giữa xem/chỉnh sửa thông tin
// ===============================
const editBtn = document.getElementById('editBtn');
const viewMode = document.getElementById('viewMode');
const editMode = document.getElementById('editMode');

if (editMode) editMode.style.display = 'none';
if (viewMode) viewMode.style.display = 'block';

// Hiển thị form edit khi nhấn nút Chỉnh sửa
if (editBtn) {
    editBtn.addEventListener('click', () => {
    viewMode.style.display = 'none';
    editMode.style.display = 'flex';
    });
}

// Xử lý submit form Cập nhật
editMode.addEventListener('submit', function(e) {
    e.preventDefault(); // Ngăn reload trang

    // Lấy giá trị từ input
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address_acc').value;

    // Cập nhật lại phần view
    document.querySelectorAll('.fullNameView').forEach(el => el.innerText = `${firstName} ${lastName}`);
    document.querySelectorAll('.emailView').forEach(el => el.innerText = email);
    document.querySelectorAll('.phoneView').forEach(el => el.innerText = phone);
    document.querySelectorAll('.addressView').forEach(el => el.innerText = address);

    // Chuyển về chế độ view
    editMode.style.display = 'none';
    viewMode.style.display = 'block';
});
// ===============================
// QUẢN LÝ DANH SÁCH ĐỊA CHỈ
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    loadAddressesFromLocalStorage()
});

const addressContainer = document.getElementById('address');

// ===============================
// Xử lý các event
// ===============================
function attachCardEvents(card) {
  // Edit
  const editIcon = card.querySelector('.fa-pen-to-square');
  editIcon.addEventListener('click', () => {
    editingCard = card;
    openPopup(true);

    const name = card.querySelector('.address_name').textContent.trim();
    const phone = card.querySelector('.address_info p:nth-child(1)').textContent.replace('Số điện thoại:', '').trim();
    const addrFull = card.querySelector('.address_info p:nth-child(2)').textContent.replace('Địa chỉ:', '').trim();
    const isDefault = card.classList.contains('default');

    const parts = addrFull.split(',').map(p => p.trim());
    const [addr, ward, district, city] = [parts[0] || '', parts[1] || '', parts[2] || '', parts[3] || ''];

    document.getElementById('newName').value = name;
    document.getElementById('newPhone').value = phone;
    document.getElementById('newAddress').value = addr;
    document.getElementById('newWard').value = ward;
    document.getElementById('newDistrict').value = district;
    document.getElementById('newCity').value = city;
    document.getElementById('newDefault').checked = isDefault;
  });

  // Delete
  const deleteIcon = card.querySelector('.fa-xmark');
  deleteIcon.addEventListener('click', () => {
    if (card && confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
      card.remove();
      saveAddressesToLocalStorage();
    }
  });

  // Checkbox Default
  const defaultCheckbox = card.querySelector('.defaultCheckbox');
  defaultCheckbox.addEventListener('change', () => {
    if (defaultCheckbox.checked) {
      document.querySelectorAll('.address_card').forEach(c => {
        if (c !== card) {
          c.classList.remove('default');
          const tag = c.querySelector('.default_tag');
          if(tag) tag.style.display = 'none';
          const cb = c.querySelector('.defaultCheckbox');
          if(cb) cb.checked = false;
        }
      });
      card.classList.add('default');
      const tag = card.querySelector('.default_tag');
      if(tag) tag.style.display = 'block';

      // Cập nhật selectedAddress
      const selectedAddr = {
        name: card.querySelector('.address_name').innerText,
        phone: card.querySelector('.address_info p:nth-child(1)').innerText.replace("Số điện thoại:", "").trim(),
        address: card.querySelector('.address_info p:nth-child(2)').innerText.replace("Địa chỉ:", "").trim(),
        default: true
      };
      localStorage.setItem('selectedAddress', JSON.stringify(selectedAddr));

    } else {
      card.classList.remove('default');
      const tag = card.querySelector('.default_tag');
      if(tag) tag.style.display = 'none';

      // Xóa selectedAddress khi bỏ default
      localStorage.removeItem('selectedAddress');
    }

    saveAddressesToLocalStorage();
  });
}

// ===============================
// XỬ LÝ popup address
// ===============================
let editingCard = null; // Lưu card đang chỉnh sửa
const popup = document.getElementById('popup_address');
const popupTitle = document.getElementById('popupTitle');

const btnAdd = document.querySelector('.btn_add_address');
const cancelBtn = document.getElementById('cancelAddress');
const closePopup = document.getElementById('closePopup');
const saveBtn = document.getElementById('saveAddress');

// Mở popup
function openPopup(isEdit = false) {
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // chặn cuộn nền khi mở popup
  popupTitle.textContent = isEdit ? 'THAY ĐỔI THÔNG TIN' : 'THÊM ĐỊA CHỈ MỚI';
}

// Đóng popup
function closePopupForm() {
  popup.style.display = 'none';
  document.body.style.overflow = 'auto'; // cho phép cuộn bình thường
  //clear giá trị khi đóng popup
  document.querySelectorAll('#popup_address input[type="text"]').forEach(i => i.value = '');
  document.getElementById('newDefault').checked = false;
  editingCard = null;
}

btnAdd?.addEventListener('click', () => openPopup(false));
cancelBtn?.addEventListener('click', closePopupForm);
closePopup?.addEventListener('click', closePopupForm);
popup?.addEventListener('click', e => {
  if (e.target === popup) closePopupForm();
});


// LƯU ĐỊA CHỈ từ popup(THÊM HOẶC SỬA)
saveBtn?.addEventListener('click', () => {
  const name = document.getElementById('newName').value.trim();
  const phone = document.getElementById('newPhone').value.trim();
  const city = document.getElementById('newCity').value.trim();
  const district = document.getElementById('newDistrict').value.trim();
  const ward = document.getElementById('newWard').value.trim();
  const addr = document.getElementById('newAddress').value.trim();
  const isDefault = document.getElementById('newDefault').checked;

  if (!name || !phone || !addr) {
    alert('Vui lòng điền đầy đủ thông tin!');
    return;
  }

  // Nếu địa chỉ được chọn làm mặc định → bỏ default cũ
  if (isDefault) {
    const allCards = document.querySelectorAll('.address_card');
    allCards.forEach(card => {
      // Bỏ class default
      card.classList.remove('default');

      // Ẩn tag mặc định
      const tag = card.querySelector('.default_tag');
      if (tag) tag.style.display = 'none';

      // Bỏ tick checkbox
      const cb = card.querySelector('.defaultCheckbox');
      if (cb) cb.checked = false;
    });
  }


  // Nếu đang sửa địa chỉ
  if (editingCard) {
    editingCard.querySelector('.address_name').textContent = name;
    editingCard.querySelector('.address_info p:nth-child(1)').innerHTML = `<strong>Số điện thoại:</strong> ${phone}`;
    editingCard.querySelector('.address_info p:nth-child(2)').innerHTML = `<strong>Địa chỉ:</strong> ${addr}, ${ward}, ${district}, ${city}`;
    const tag = editingCard.querySelector('.default_tag');
    tag.style.display = isDefault ? 'block' : 'none';
    editingCard.classList.toggle('default', isDefault);
    editingCard.querySelector('.defaultCheckbox').checked = isDefault;
  } 
  // Nếu là thêm mới
  else {
    const newCard = document.createElement('div');
    newCard.classList.add('address_card');
    if (isDefault) newCard.classList.add('default');

    newCard.innerHTML = `
      <div class="address_name">${name}</div>
      <div class="address_info">
        <p><strong>Số điện thoại:</strong> ${phone}</p>
        <p><strong>Địa chỉ:</strong> ${addr}, ${ward}, ${district}, ${city}</p>
        <span class="default_tag" style="${isDefault ? '' : 'display:none;'}">Địa chỉ mặc định</span>
      </div>
      <div class="address_actions">
        <label><input type="checkbox" class="defaultCheckbox" ${isDefault ? 'checked' : ''}> Làm mặc định</label>
        <i class="fa-solid fa-pen-to-square"></i>
        <i class="fa-solid fa-xmark"></i>
      </div>
    `;
    attachCardEvents(newCard);

    addressContainer.insertBefore(newCard, btnAdd);
  }
  // Cập nhật selectedAddress nếu đây là địa chỉ mặc định
  if (isDefault || (editingCard && editingCard.classList.contains('default'))) {
      const selectedAddr = {
          name: name,
          phone: phone,
          address: `${addr}, ${ward}, ${district}, ${city}`,
          default: true
      };
      localStorage.setItem('selectedAddress', JSON.stringify(selectedAddr));
  }
  saveAddressesToLocalStorage()
  closePopupForm();
});

// ===============================
// Lưu danh sách địa chỉ vào localStorage
// ===============================
function saveAddressesToLocalStorage() {
  const addresses = [];
  document.querySelectorAll('.address_card').forEach(card => {
      const name = card.querySelector('.address_name').innerText;
      const phone = card.querySelector('.address_info p:nth-child(1)').innerText.replace("Số điện thoại:", "").trim();
      const addrText = card.querySelector('.address_info p:nth-child(2)').innerText.replace("Địa chỉ:", "").trim();
      const isDefault = card.classList.contains('default');

      addresses.push({
          name: name,
          phone: phone,
          address: addrText,
          default: isDefault
      });
  });

  localStorage.setItem('userAddresses', JSON.stringify(addresses));
}

// ===============================
// Load địa chỉ từ localStorage
// ===============================
function loadAddressesFromLocalStorage() {
  const data = localStorage.getItem('userAddresses');
  if (!data) 
    return;

  const addresses = JSON.parse(data);
  addresses.forEach(addr => {
      const card = document.createElement('div');
      card.classList.add('address_card');
      if (addr.default) card.classList.add('default');

      card.innerHTML = `
          <div class="address_name">${addr.name}</div>
          <div class="address_info">
              <p><strong>Số điện thoại:</strong> ${addr.phone}</p>
              <p><strong>Địa chỉ:</strong> ${addr.address}</p>
              <span class="default_tag" style="display:${addr.default ? 'block' : 'none'};">Địa chỉ mặc định</span>
          </div>
          <div class="address_actions">
              <label>
                  <input type="checkbox" class="defaultCheckbox" ${addr.default ? 'checked' : ''}>
                  Làm mặc định
              </label>
              <i class="fa-solid fa-pen-to-square"></i>
              <i class="fa-solid fa-xmark"></i>
          </div>
      `;

      attachCardEvents(card);

      addressContainer.insertBefore(card, btnAdd);
  });
}

// ===============================
// HIỆU ỨNG NHẸ CHO THẺ ĐỊA CHỈ
// ===============================
document.querySelectorAll('.address_card').forEach(card => {
  card.addEventListener('mouseover', () => card.style.transform = 'translateY(-2px)');
  card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');
  card.style.transition = 'transform 0.2s ease';
});

// ===============================
// Mở tab address và thêm nút quay lại nếu đến từ payment
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#address') {
    const addressTabMenu = document.querySelector('.account_sidebar li[data-target="address"]');
    const addressContent = document.querySelector('#address');

    if (addressTabMenu && addressContent) {
      // Bỏ class active ở các tab khác
      document.querySelectorAll('.account_sidebar li').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab_content').forEach(content => content.classList.remove('active'));

      // Kích hoạt tab địa chỉ
      addressTabMenu.classList.add('active');
      addressContent.classList.add('active');

      // Kiểm tra returnPage để tạo nút quay lại
      const returnPage = localStorage.getItem('returnPage');
      if (returnPage) {
        const backBtn = document.createElement('button');
        backBtn.textContent = '↩ Quay lại thanh toán';
        backBtn.classList.add('btn_green');
        backBtn.style.marginBottom = '15px';

        backBtn.addEventListener('click', () => {
          localStorage.removeItem('returnPage'); // xóa key
          window.location.href = returnPage; // quay về payment.html
        });

        // Chèn nút vào đầu tab address
        addressContent.prepend(backBtn);
      }
    }
  }
});

// ===============================
// ORDERS HISTORY
// ===============================

// ==================== FORMAT MONEY ====================
function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

// Hàm map trạng thái đơn hàng cho dễ đọc
function mapOrderStatus(status) {
  switch (status) {
    case "Pending": return "Chờ xử lý";
    case "Processing": return "Đang giao";
    case "Shipped": return "Đã giao";
    case "Completed": return "Hoàn tất";
    case "Cancelled": return "Đã hủy";
    default: return status;
  }
}

async function loadOrderHistory() {
    try {
        const res = await fetch(`${API_BASE_URL}/orders/history`, { credentials: "include" });
        const data = await res.json();

        const tbody = document.querySelector(".order_table tbody");
        tbody.innerHTML = ""; // xóa dữ liệu cũ

        if (!data.orders || data.orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4">Chưa có đơn hàng nào</td></tr>`;
            return;
        }

        data.orders.forEach(order => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>#DH${order.order_id}</td>
                <td>${new Date(order.order_date).toLocaleDateString("vi-VN")}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>${mapOrderStatus(order.status)}</td>
            `;

            // Khi click vào hàng => chuyển đến trang chi tiết
            tr.style.cursor = "pointer";
            tr.addEventListener("click", () => {
              window.location.href = `/order_detail.html?order_id=${order.order_id}`;
            });

            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Load order history error:", err);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    loadOrderHistory();
});
