// ---------- USERS ----------
let users = [
  {username:"printech", password:"printech", role:"Admin"}
];
localStorage.setItem("users", JSON.stringify(users));

let loggedInUser = null;
let loginTimestamp = null;

// ---------- EMPLOYEES ----------
let employees = JSON.parse(localStorage.getItem("employees")) || [];
let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
let stock = JSON.parse(localStorage.getItem("stock")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let agents = JSON.parse(localStorage.getItem("agents")) || [];
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// ---------- LOGIN ----------
function login(){
  let username = loginUser.value.trim();
  let password = loginPass.value.trim();
  let user = users.find(u => u.username===username && u.password===password);
  if(user){
    loggedInUser = user;
    loginTimestamp = new Date();
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    localStorage.setItem("loginTimestamp", loginTimestamp);

    loginPage.classList.add("hidden");
    document.querySelector(".sidebar").classList.remove("hidden");
    document.querySelector(".main-content").classList.remove("hidden");

    document.getElementById("loggedUser").innerText = user.username;
    updateLoginDuration();
    setInterval(updateLoginDuration, 1000);

    showModulesByRole(user.role);
    showSection('dashboard');
    updateDashboard();
  } else {
    alert("Invalid username or password");
  }
}

// ---------- LOGOUT ----------
function logout(){
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("loginTimestamp");
  location.reload();
}

// ---------- LOGIN DURATION ----------
function updateLoginDuration(){
  if(!loginTimestamp) return;
  let now = new Date();
  let diff = Math.floor((now - new Date(loginTimestamp))/1000);
  let h = Math.floor(diff/3600);
  let m = Math.floor((diff%3600)/60);
  let s = diff%60;
  loginTime.innerText = `${h}h ${m}m ${s}s`;
}

// ---------- MODULE ACCESS ----------
function showModulesByRole(role){
  const buttons = {
    dashboard: document.querySelector("li[data-section='dashboard']"),
    employee: document.querySelector("li[data-section='employee']"),
    attendance: document.querySelector("li[data-section='attendance']"),
    stock: document.querySelector("li[data-section='stock']"),
    customer: document.querySelector("li[data-section='customer']"),
    accounts: document.querySelector("li[data-section='accounts']")
  };
  Object.values(buttons).forEach(b=>b.style.display="none");

  if(role==="Admin"){
    Object.values(buttons).forEach(b=>b.style.display="block");
  } else {
    buttons.dashboard.style.display="block";
    buttons.attendance.style.display="block";
    buttons.stock.style.display="block";
    buttons.customer.style.display="block"; // optional if employee manages customers
  }
}

// ---------- SHOW SECTION ----------
function showSection(id){
  document.querySelectorAll("main section").forEach(s=>s.classList.add("hidden"));
  const sec = document.getElementById(id);
  if(sec) sec.classList.remove("hidden");
  if(id==='dashboard') updateDashboard();
}

// ---------- EMPLOYEE MODULE ----------
function addEmployee(){
  if(loggedInUser.role!=="Admin") return alert("Only admin can add employee");
  let name=empName.value, role=empRole.value, phone=empPhone.value, username=empUsername.value.trim(), password=empPassword.value.trim();
  if(!name||!role||!phone||!username||!password) return alert("Fill all fields");
  employees.push({name,role,phone,username,password,loginTime:null,logoutTime:null});
  localStorage.setItem("employees", JSON.stringify(employees));

  users.push({username,password,role});
  localStorage.setItem("users",JSON.stringify(users));

  empName.value=empPhone.value=empRole.value=empUsername.value=empPassword.value="";
  showEmployees();
}
function showEmployees(){
  empList.innerHTML="";
  employees.forEach((e,i)=>{
    let buttonsHTML="";
    if(loggedInUser.role==="Admin")
      buttonsHTML=`<button onclick="editEmployee(${i})">Edit</button> <button onclick="deleteEmployee(${i})">Delete</button>`;
    empList.innerHTML+=`<li class="list-item">${e.name} - ${e.role} - ${e.phone} <span>${buttonsHTML}</span></li>`;
  });
}

// ---------- STOCK MODULE ----------
function addStock(){
  let name=itemName.value, available=Number(itemAvailable.value), required=Number(itemRequired.value);
  if(!name||!available||!required) return alert("Fill all fields");
  stock.push({name,available,required});
  localStorage.setItem("stock", JSON.stringify(stock));
  itemName.value=itemAvailable.value=itemRequired.value="";
  showStock();
  updateDashboard();
}
function showStock(){
  stockList.innerHTML="";
  stock.forEach((s,i)=>{
    let status=s.available<s.required?`<span class="low">LOW</span>`:`<span class="ok">OK</span>`;
    let buttonsHTML="";
    if(loggedInUser.role==="Admin")
      buttonsHTML=`<button onclick="editStock(${i})">Edit</button> <button onclick="deleteStock(${i})">Delete</button>`;
    stockList.innerHTML+=`<div class="list-item"><div><strong>${s.name}</strong><br>Available: ${s.available} | Required: ${s.required}</div><span>${status} ${buttonsHTML}</span></div>`;
  });
}

// ---------- CUSTOMER MODULE ----------
function addCustomer(){
  let name=cusName.value, phone=cusPhone.value, placed=orderPlaced.value, deadline=orderDeadline.value;
  if(!name||!phone||!placed||!deadline) return alert("Fill all fields");
  customers.push({name,phone,placed,deadline});
  localStorage.setItem("customers",JSON.stringify(customers));
  cusName.value=cusPhone.value=orderPlaced.value=orderDeadline.value="";
  showCustomers();
  updateDashboard();
}
function showCustomers(){
  cusList.innerHTML="";
  let today=new Date();
  customers.forEach((c,i)=>{
    let urgent="";
    if(new Date(c.deadline)<=today) urgent=`<span class="low">URGENT</span>`;
    let buttonsHTML="";
    if(loggedInUser.role==="Admin")
      buttonsHTML=`<button onclick="editCustomer(${i})">Edit</button> <button onclick="deleteCustomer(${i})">Delete</button>`;
    cusList.innerHTML+=`<li class="list-item">${c.name} - ${c.phone} - Placed: ${c.placed} - Deadline: ${c.deadline} ${urgent} <span>${buttonsHTML}</span></li>`;
  });
}

// ---------- DASHBOARD ----------
function updateDashboard(){
  let empLogged = employees.filter(e=>e.loginTime && !e.logoutTime).length;
  empLoggedIn.innerText=empLogged;
  let urgentStock = stock.filter(s=>s.available<s.required).length;
  urgentStocks.innerText = urgentStock;
  let urgentCus = customers.filter(c=>new Date(c.deadline)<=new Date()).length;
  urgentCustomers.innerText = urgentCus;
  updateAccounts();
}

// ---------- ACCOUNTS MODULE ----------
function updateAccounts(){
  // Employee Phase
  accountsEmployees.innerHTML="";
  employees.forEach(e=>{
    let hours=0;
    if(e.loginTime && e.logoutTime) hours=Math.round((new Date(e.logoutTime)-new Date(e.loginTime))/3600000);
    let salary = hours*100; // example hourly rate
    accountsEmployees.innerHTML+=`<tr><td>${e.name}</td><td>${e.role}</td><td>${hours}</td><td>${salary}</td></tr>`;
  });

  // Agent Phase
  accountsAgents.innerHTML="";
  agents.forEach(a=>{
    let total=a.jobs.reduce((sum,j)=>sum+j.amount,0);
    accountsAgents.innerHTML+=`<tr><td>${a.name}</td><td>${a.jobs.map(j=>j.title).join(", ")}</td><td>${a.jobs.map(j=>j.amount).join(", ")}</td><td>${total}</td></tr>`;
  });

  // Shop Expenses
  accountsExpenses.innerHTML="";
  expenses.forEach(exp=>accountsExpenses.innerHTML+=`<tr><td>${exp.name}</td><td>${exp.amount}</td><td>${exp.date}</td></tr>`);
}
