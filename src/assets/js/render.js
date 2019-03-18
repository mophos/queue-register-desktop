
$(document).ready(async function () {

  var CLIENT;
  var servicePoints = await getServicePoints();
  setServicePoints();

  var IS_OFFLINE = false;

  async function getServicePoints() {
    var _servicePoints = sessionStorage.getItem('servicePoints');
    return JSON.parse(_servicePoints);
  }

  async function cancelQueue(queueId) {
    var _apiUrl = localStorage.getItem('apiUrl');
    var token = sessionStorage.getItem('token');

    try {
      const _url = `${_apiUrl}/queue/cancel/${queueId}`;
      var rs = await axios.delete(_url, { headers: { "Authorization": `Bearer ${token}` } });
      if (rs.data.statusCode === 200) {
        getQueue();
      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'ไม่สามารถยกเลิกคิวได้',
        });
      }
    } catch (error) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'เกิดข้อผิดพลาด',
      });
      console.log(error);
    }
  }

  async function getQueue() {
    try {
      var _apiUrl = localStorage.getItem('apiUrl');
      var token = sessionStorage.getItem('token');

      // var selected = $('#slServicePoints').val();

      const _url = `${_apiUrl}/queue/all-queue/active`;
      const rs = await axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });

      if (rs.data) {
        var data = rs.data;
        if (data.statusCode === 200) {
          console.log(data.results);
          renderQueue(data.results);
        }
      } else {
        alert(rs.message);
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  }

  async function getPriorities() {
    try {
      var _apiUrl = localStorage.getItem('apiUrl');
      var token = sessionStorage.getItem('token');
      const _url = `${_apiUrl}/priorities`;
      const rs = await axios.get(_url, { headers: { "Authorization": `Bearer ${token}` } });

      if (rs.data) {
        var data = rs.data;
        if (data.statusCode === 200) {
          console.log(data.results);
          renderPriorities(data.results);
        }
      } else {
        alert(rs.message);
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  }

  async function printQueue(queueId) {
    var printerId = localStorage.getItem('printerId');
    var printSmallQueue = localStorage.getItem('printSmallQueue') || 'N';

    if (printerId) {
      try {
        var topic = `/printer/${printerId}`;
        var _apiUrl = localStorage.getItem('apiUrl');
        var token = sessionStorage.getItem('token');

        const _url = `${_apiUrl}/print/queue/prepare/print`;
        const rs = await axios.post(_url, {
          queueId: queueId,
          topic: topic,
          printSmallQueue: printSmallQueue
        }, { headers: { "Authorization": `Bearer ${token}` } });

        if (rs.data) {
          var data = rs.data;
          if (data.statusCode === 200) {
            Swal.fire({
              type: 'success',
              text: 'พิมพ์บัตรคิวเรียบร้อย',
              timer: 2000
            });
          }
        } else {
          alert(rs.message);
        }
      } catch (error) {
        console.log(error);
        this.alertService.error('ไม่สามารถพิมพ์บัตรคิวได้');
      }
    } else {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่พบเครื่องพิมพ์',
      });
    }
  }

  async function registerQueue(hn, servicePointId, priorityId) {

    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อกับ Notify Server ได้',
      });
    } else {
      try {
        var _apiUrl = localStorage.getItem('apiUrl');
        var token = sessionStorage.getItem('token');

        const _url = `${_apiUrl}/queue/prepare/register`;
        const body = {
          hn: hn,
          servicePointId: servicePointId,
          priorityId: priorityId
        };

        const rs = await axios.post(_url, body, { headers: { "Authorization": `Bearer ${token}` } });

        if (rs.data) {
          var data = rs.data;
          if (data.statusCode === 200) {
            var queueId = data.queueId;
            if (queueId) {
              $('#txtHN').val('');
              $('#txtHN').focus();
              printQueue(queueId);
            } else {
              Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'ไม่พบคิว',
              });  
            }
          }
        } else {
          Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: rs.data.message,
          });        }
      } catch (error) {
        console.log(error);
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'เกิดข้อผิดพลาด',
        });
      }
    }

  }

  function setServicePoints() {
    var slTransferServicePoints = $('#slTransferServicePoints');
    slTransferServicePoints.empty();

    $.each(servicePoints, (k, v) => {
      var html = `
        <option value="${v.service_point_id}">${v.service_point_name}</option>
      `;

      slTransferServicePoints.append(html);
    });
  }

  function renderQueue(data) {
    var listQueue = $('#listQueue');
    listQueue.empty();

    $.each(data, (k, v) => {
      var html = `
      <li class="list-group-item list-group-item-action flex-column align-items-start">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="text-danger font-weight-bold">${v.queue_number}</h5>
            <h5 class="mb-1">${v.title}${v.first_name} ${v.last_name}</h5>
          </div>
          <div class="d-flex w-100 justify-content-between">
            <div>
              <p class="mb-1 font-weight-bold">HN : ${v.hn}</p>
              <p class="mb-1">${v.priority_name}</p>
              <p class="mb-1">${v.room_name ? v.room_name : ''}</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-success" data-name="btnPrintQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">พิมพ์</button>
              <button class="btn btn-danger" data-roomid="${v.room_id}" data-roomname="${v.room_name}" data-name="btnCancelQueue" data-number="${v.queue_number}" data-queue-id="${v.queue_id}">ยกเลิก</button>
            </div>
          </div>
        </li>
      `;

      listQueue.append(html);
    });
  }

  function renderPriorities(data) {
    var slPriorities = $('#slPriorities');
    slPriorities.empty();

    $.each(data, (k, v) => {
      var html = `
        <option value="${v.priority_id}">${v.priority_name}</option>
      `;

      slPriorities.append(html);
    });
  }

  function connectWebSocket() {

    const GLOBAL_TOPIC = sessionStorage.getItem('QUEUE_CENTER_TOPIC');
    const NOTIFY_URL = `ws://${sessionStorage.getItem('NOTIFY_SERVER')}:${+sessionStorage.getItem('NOTIFY_PORT')}`;
    const NOTIFY_USER = sessionStorage.getItem('NOTIFY_USER');
    const NOTIFY_PASSWORD = sessionStorage.getItem('NOTIFY_PASSWORD');

    try {
      CLIENT.end(true);
    } catch (error) {
      console.log(error);
    }

    CLIENT = mqtt.connect(NOTIFY_URL, {
      username: NOTIFY_USER,
      password: NOTIFY_PASSWORD
    });

    const TOPIC = `${GLOBAL_TOPIC}`;

    CLIENT.on('connect', () => {
      console.log('Connected!');
      document.title = `CONNECTED - ${sessionStorage.getItem('FULLNAME')}`;
      IS_OFFLINE = false;

      CLIENT.subscribe(TOPIC, (error) => {
        console.log('Subscribe : ' + TOPIC);
        if (error) {
          IS_OFFLINE = true;
          console.log(error);
        }
      });
    });

    CLIENT.on('close', () => {
      document.title = 'CONNECTION CLOSED!';
      IS_OFFLINE = true;
      console.log('Close');
    });

    CLIENT.on('message', (_topic, payload) => {
      getQueue();
    });

    CLIENT.on('error', (error) => {
      console.log('Error');
      IS_OFFLINE = true;
      document.title = 'CONNECTION ERROR!'
    });

    CLIENT.on('offline', () => {
      IS_OFFLINE = true;
      console.log('Offline');
      document.title = 'OFFLINE!';
    })
  }

  $.each(servicePoints, (k, v) => {
    $('#slServicePoints').append($("<option/>", {
      value: v.service_point_id,
      text: `${v.local_code} - ${v.service_point_name}`
    }));
  });

  document.title = sessionStorage.getItem('FULLNAME');

  connectWebSocket();
  getPriorities();
  getQueue();

  $('#txtHN').on('keyup', function (e) {
    if (e.keyCode === 13) {
      var hn = $(this).val().trim();
      var servicePointId = $('#slServicePoints').val();
      var priorityId = $('#slPriorities').val();

      if (hn && servicePointId && priorityId) {
        registerQueue(hn, servicePointId, priorityId);
      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'กรุณาระบุข้อมูลให้ครบ',
        });
      }
    }
  });

  $('#btnRegister').on('click', function (e) {
    var hn = $('#txtHN').val().trim();
    var servicePointId = $('#slServicePoints').val();
    var priorityId = $('#slPriorities').val();

    if (hn && servicePointId && priorityId) {
      registerQueue(hn, servicePointId, priorityId);
    } else {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'กรุณาระบุข้อมูลให้ครบ',
      });
    }
  });

  $('body').on('click', 'button[data-name="btnCancelQueue"]', async function (e) {
    e.preventDefault();

    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      var roomId = $(this).data('roomid');
      var queueNumber = $(this).data('number');
      var queueId = $(this).data('queue-id');
      if (roomId) {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'คนไข้เรียกเข้าห้องตรวจแล้วไม่สามารถลบได้',
        });
      } else {
        if (queueId) {
          cancelQueue(queueId);
        }
      }
    }
  });

  $('body').on('click', 'button[data-name="btnPrintQueue"]', async function (e) {
    e.preventDefault();

    if (IS_OFFLINE) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'ไม่สามารถเชื่อมต่อ Notify Server ได้',
      });
    } else {
      var queueId = $(this).data('queue-id');
      if (queueId) {
        printQueue(queueId);
      } else {
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'ไม่พบคิว',
        });
      }
    }
  });

  $('#btnRefresh').on('click', function (e) {
    e.preventDefault();

    getQueue();
  });

});


