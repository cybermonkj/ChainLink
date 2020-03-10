const contractSource = `

payable contract Register =


    record chainee = {
        email : s,
        phone : i,
        cv : s,
        hired : int,
        ownerAddress : a,
        id : i,
        price : i,
        work : s,
        hours : i,
        company : s,
        name : s}

    record state = {
        chainees : map(i,chainee),
        userLength : i}
 
    entrypoint init() = {chainees = {}, userLength = 0}

    entrypoint userLength() = 
        state.userLength

    entrypoint getChaineeById(index : int)= 
        state.chainees[index]
        


    stateful entrypoint register(chainName:s, chainEmail :s, chainExpectedSalary :i, chainJobtype :s, chainWorkingHours : i, chainCompany : s, chainJobsample : s, chainPhone : i) = 
        let newChain = {
        
            email = chainEmail,
            price = chainExpectedSalary,
            hours = chainWorkingHours,
            cv = chainJobsample,
            hired = 0,
            name = chainName,
            phone = chainPhone,
            work = chainJobtype,
            company = chainCompany,
            id = userLength() + 1,
            ownerAddress = Call.caller}
        let index = userLength() +1

        put(state{chainees[index] = newChain, userLength = index})

        "New chainee Added to ChainLink"


    stateful payable entrypoint hireChainee(index : i) = 
        let employeeAddress = getChaineeById(index).ownerAddress
        require(Call.caller != employeeAddress, "Chain Error: You cannot Hire yourself;)")
        let toBeHired = getChaineeById(index)
        Chain.spend(toBeHired.ownerAddress, toBeHired.price)
        let hired = state.chainees[index].hired +1
        put(state{chainees[index].hired = hired })
        "Chainee was Hired successfully"
        

    type a = address
    type i = int
    type s = string

`;

const contractAddress = "ct_2X3tyGXAoXBEYv52VBRoeKtYsAtMTu1Qu8B3UWDaHLoRLKmY2A;
client = null;
chainArray = [];

function renderProduct() {
 
  var template = $('#template').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
    chainArray
  });




  $('#section').html(rendered);
  console.log("Rendered")
}

async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}



// test



document.addEventListener('DOMContentLoaded', async () => {

  $("#loadings").show();
  $('#registerSection').hide();


  const node = await IpfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',

  })
  console.log(node)
  window.node = node

  $("#loadings").hide();

})
var buffer = null

window.addEventListener('load', async () => {
  $("#loadings").show();
  $('#registerSection').hide();

  client = await Ae.Aepp()

  gameLength = await callStatic('userLength', []);



  for (let i = 1; i <= gameLength; i++) {
    const newuser = await callStatic('getChaineeById', [i]);
    console.log("pushing to array")

    var random  = newuser.name
    var randomletter  = random.charAt(0)

    chainArray.push({
      id: newuser.id,
      name: newuser.name,
      phone: newuser.phone,
      email: newuser.email,
      price: newuser.price,
      hired: newuser.hired,
      owner: newuser.ownerAddress,
      hash: newuser.cv,
      work : newuser.work,
      hours : newuser.hours,
      company : newuser.company,
      randomLetter: randomletter

    })
  }

  renderProduct();
  console.log("pushed succeessfully")
  $("#loadings").hide();
});


const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });  // This connects youtopublic ipfs gateway
async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const buffer = Buffer.from(reader.result)
      ipfs.add(buffer)
        .then(files => {
          resolve(files)
        })
        .catch(error => reject(error))
    }
    reader.readAsArrayBuffer(file)
  })
}




// Register User
$('#submitBtn').click(async function () {
  $("#loadings").show();

  var name = ($('#chainName').val()),

  phone = ($('#chainPhone').val()),

  price = ($('#chainExpectedSalary').val());

  email = ($('#chainEmail').val());

  company = ($('#chainCompany').val());

  hours = ($('#chainWorkingHours').val());

  work = ($('#chainJobtype').val());

  newfile = document.getElementById('addedFile')


  console.log(newfile)
  console.log(newfile.files[0])

  file = newfile.files[0]
  const files = await uploadFile(file)
  const multihash = files[0].hash

  prices = parseInt(price, 10)
  var random  = name
  var randomletter  = random.charAt(0)
  reggame = await contractCall('register', [name, phone, email, price, work, hours, company, multihash], 0)
  console.log(multihash)




  chainArray.push({
    id: chainArray.length + 1,
    name: name,
    hash: multihash,
    price: prices,
    email : email,
    company : company,
    work : work,
    hours : hours,
    randomLetter : randomletter



  })
  location.reload((true))
  renderProduct();
  $("#loadings").hide();
});




$("#section").on("click", ".hirebutton", async function (event) {
  $("#loadings").show();
  console.log("Please wait Hiring Worker")

  // targets the element being clicked
  dataIndex = event.target.id
  console.log("dataindex", dataIndex)

  // calls the getGame function from the smart contract
  user = await callStatic('getChaineeById', [dataIndex])

  userPrice = parseInt(user.price, 10)
  console.log(userPrice)


  await contractCall('hireChainee', [dataIndex], userPrice )

  renderProduct();

  console.log("Successful, Proceed to Contact Chainee")
  
  $("#loadings").hide();
});


$("#section").on( "click", ".downloadcv", async function (event) {
  $("#loadings").show();

  console.log("Downloading Chainee CV ")
  dataIndex = event.target.id
  console.log("dataindex", dataIndex)
  cv = await callStatic('getChaineeById', [dataIndex])
  console.log("CV Link")
  console.log("https://ipfs.io/ipfs/" + cv.cv)
  
  $("#loadings").hide();
});

// Register form
$('#registerLink').click( function(event){
  console.log("Displaying register form")
  $('#registerSection').show();
  $('#chainssection').hide();

})

// Show CHainees
$('#chainLink').click( function(event){
  console.log("Showing Chainee list")
  $('#registerSection').hide();
  $('#chainssection').show();
})

$('#homeLink').click( function(event){
  console.log("Showing home")
  location.reload(true)
})