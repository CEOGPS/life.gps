"use strict";


/*
// Function to get the selected text from the page
function getSelectedText() {
  return window.getSelection().toString();
}



// Get the currently active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
{
    // Execute a script to get the selected text in the tab
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: getSelectedText
      },
      (results) => {
        // Display the selected text in the popup
        if (results && results[0] && results[0].result)
        {
          document.getElementById("email").value = results[0].result;

        } else
        {
          var email = window.localStorage.getItem('last_email');
          document.getElementById("email").value = email;
          //document.getElementById("word").textContent = "No text selected.";
        }

          if ($('#email').val())
          {
            processForm();
          }
      }
    );
  });
*/

$(function ()
{

//alert('run js');

  $(document).on('submit', 'form', function(e)
  {
    e.preventDefault();

    var force = true;
    processForm(force);
  });

  /*chrome.storage.local.get('last_email', function (data)
  {
    window.localStorage.setItem
    //document.getElementById("word").value = data.selectedText;
    console.log('storage', data);
    $('#email').val(data.last_email);

    if ($('#email').val())
    {
      $('form').submit();
    }
  });*/

  chrome.storage.local.get('selectedText', function (data)
  {
    console.log('storage', data);

    $('#email').val(data.selectedText);

    if ($('#email').val())
    {
      $('form').submit();
    }
  });


});


function processForm(force)
{
  var $form = $('form');

  var $progress = $('.fa-spin');
  $('[data-res]').hide();


  var email = $('#email').val();

  //var short_url = null;

  var storage_key = 'email_data_' + email;

  /*if(short_url = window.localStorage.getItem(url_storage_key))
  {
    $('[data-res]').show();
    $('#short_url').val(short_url);
    return;
  } */


  /*if (!force)
  {
    var email_data = window.localStorage.getItem(storage_key);

    if (email_data)
    {
      //var last_response = window.localStorage.getItem('last_response');
      //if (last_response)
      //{
        $('[data-res]').show();
        $('[data-res]').html(email_data);
        return;
      //}
    }
  } */



  var ajax_cfg = {};
  ajax_cfg.method = 'get';
  ajax_cfg.url = 'https://email-checker.pro/api/email-checker';
  ajax_cfg.data = {};
  ajax_cfg.data.email = email;
  ajax_cfg.data.ver = 2;
  //ajax_cfg.processData = false;
  //ajax_cfg.contentType = false;
  //context: this,

  ajax_cfg.beforeSend = function (xhr, settings)
  {
    $progress.show();
    //$('[data-res]').html('');
    //$('[data-res-wrapper]').hide();
  };

  ajax_cfg.completed = function (xhr,textStatus)
  {
    $progress.hide();
    console.log('completed', xhr, textStatus);
  };

  ajax_cfg.error = function (xhr, status, error)
  {
    $progress.hide();

    if (!xhr.status)
    {
      alert("Please check internet connection");
      return;
    }

    console.log('error', 'st', status, 'err', error, 'xhr', xhr);
    //alert(xhr.responseUrl);
    alert("Error: " + status + "\n" + error + "\n" + xhr.responseText);

    alert(JSON.stringify(xhr));
  };

  ajax_cfg.success = function (data, status, xhr)
  {
    $progress.hide();

    console.log('xhr', xhr);
    console.log('response', data);

    //window.localStorage.setItem(storage_key, data.text);

    $('[data-res]').html(data.text);
    $('[data-res-wrapper]').show();

    //if (data.success)
    //{
      $('[data-res]').show();
      //$('[data-res]').html(data.short_url);

      $('[data-res]').html(data.text);

    //window.localStorage.setItem('last_email', email);
    chrome.storage.local.set({selectedText:email});

    //}
  };

  console.log('ajax_cfg', ajax_cfg);

  /*try
  { */
    jQuery.ajax(ajax_cfg);
  /*}
  catch(e)
  {
    console.log('e-catch', e);
  } */
}

