var default_color_map = {
  0: "#ffffff",
  1: "#49483e",
  2: "#66d9ef",
  3: "#6bc72b",
  4: "#f92672",
  5: "#77543e",
  6: "#9459ff",
  7: "#fd971f",
  8: "#e6db74",
  9: "#a6e22e",
  10: "#35b091",
  11: "#66efd5",
  12: "#66d9ef",
  13: "#ae81ff",
  14: "#75715e",
  15: "#cfcfc2",
  16: "#ffffff",
  17: "#49483e",
  18: "#66d9ef",
  19: "#6bc72b",
  20: "#f92672",
  21: "#77533e",
  22: "#9459ff",
  23: "#fd971f",
  24: "#e6db74",
  25: "#a6e22e",
  26: "#35b091",
  27: "#66efd5",
  28: "#66d9ef",
  29: "#ae81ff",
  30: "#75715e",
  31: "#cfcfc2",
  256: "#f8f8f2",
  257: "#000000",
  258: "#cfcfc2",
  259: "#131313",
  260: "#ff0000",
  261: "#888888",
  262: "#ffaa00",
  263: "#85a83f",
  264: "#75715e",
  265: "#f92672"
};

var events;

function setColors(color_map) {
  $('style#color_map').remove();
  var stylesheet = '';
  $.each(color_map, function(color_id, color_hex) {
    stylesheet += '.fg' + color_id + '{color:' + color_hex + ';}\n';
    stylesheet += '.bg' + color_id + '{background-color:' + color_hex + ';}\n';
  });
  var $stylesheet = $('<style>' + stylesheet + '</style>');
  $stylesheet.attr('id', 'color_map');
  $('head').append($stylesheet);
}

function buildEditor(events) {
  $.each(events, function(event_name,event) {
    var $event = $('<div class="event row-fluid" />');
    $event.attr('data-event', event_name);
    $event.append($('<label class="span2 name" />'));
    $event.append($('<span class="span5 message"><input class="input-block-level" /></span>'));
    $event.append($('<span class="span5 output"><pre class=" fg256 bg259" /></span>'));
    //$event.append($(''));
    //$event.html('');
    $event.find('.name').text(event_name);
    $('#events').append($event);
  });
  
  $('#events .event .message input').bind('change keyup', function(){
    var $event = $(this).parents('.event');
    var event_name = $event.attr('data-event');
    var message = $(this).val();
    
    // Color
    message = message.replace(/%C((\d+)(,(\d+))?)?/g, function(match, id_group, foreground, bg_group, background, offset, string) {
      var s = '</span><span class="';
      if (foreground) s += 'fg' + foreground;
      s += " ";
      if (background) s += 'bg' + background;
      s += '">';
      return s;
    });
    
    // Bold
    message = message.replace(/%B(.*?)(%B|%O|$)/g, function(match, text, end, offset, string) {
      return '<b>' + text + '</b>';
    });
    
    // Underline
    message = message.replace(/%U(.*?)(%U|%O|$)/g, function(match, text, end, offset, string) {
      return '<u>' + text + '</u>';
    });
    
    // Reset
    message = message.replace(/%O/g, function(match, offset, string) {
      return '</span><span>';
    });
    
    // Hidden
    message = message.replace(/\%H(.*?)%H/g, function(match, text, offset, string) {
      return '<span class="hidden">' + text + '</span>';
    });
    
    // Seperator
    message = message.replace(/\$t/g, function(match, offset, string) {
      return '</span></span><span class="inline-block"><span>';
    });
    
    // Variables Tooltips
    message = message.replace(/(\$(\d+))/g, function(match, text, arg_id, offset, string) {
      var help_text = events[event_name].args[arg_id - 1];
      return '<span rel="tooltip" data-placement="bottom" title="' + help_text + '">' + text + '</span>';
    });
    
    message = '<span class="message-left inline-block"><span>' + message + '</span></span>';
    $event.find('.output pre').html(message);
  });
  
  $('[rel=tooltip]').tooltip();
  
  $('#events .event .message input').popover({
    trigger: 'focus',
    title: 'Arguments',
    html: true,
    content: function(){
      var $event = $(this).parents('.event');
      var event_name = $event.attr('data-event');
      var args = events[event_name].args;
      var list = $('<ol />');
      $.each(args, function(id, help_text) {
        list.append($('<li />').append(help_text));
      });
      return list;
    }
  });
  
  $('#defaults').click(setDefaults);
  
  $('#import').click(function(){
    importPEventConf();
    importColorsConf();
  });
  
  $('#export').click(function(){
    var output = '';
    $.each(events, function(event_name, event) {
      var $event = $("[data-event='" + event_name + "']");
      var event_text = $event.find('.message input').val();
      output += 'event_name='+event_name+'\n';
      output += 'event_text='+event_text+'\n\n';
    });
    window.open('data:text/plain;charset=utf-8,' + encodeURIComponent(output));
  });
}

function importFile(selector, callback) {
  var files = $(selector)[0].files;
  
  if (!files.length) {
    console.log(selector, 'Skipped importing this file');
    return;
  }
  
  var file = files[0];
    
  var reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  
  reader.readAsText(file);
}

function setDefaults() {
  populateEventsUsingDefaults(events);
  setColors(default_color_map);
}

function importPEventConf() {
  importFile('#file_pevents_conf', parsePEventConf);
}

function importColorsConf() {
  importFile('#file_colors_conf', parseColorsConf);
}

function polulateEvent(event_name, event_text) {
  var $event = $("[data-event='" + event_name + "']");
  $event.find('.message input').val(event_text).change();
  //console.log(event_name, event_text);
}

function populateEventsUsingDefaults(events) {
  $.each(events, function(event_name, event) {
    polulateEvent(event_name, event.msg);
  });
}

function parsePEventConf(str) {
  if (!str) {
    console.log('parsePEventConf', 'Skipped importing this file');
    return; // File was not imported;
  }
  
  var re = /event_name=(.+)\nevent_text=(.+)(\n|$)/g;
  var result;
  while ((result = re.exec(str)) !== null) {
    var event_name = result[1];
    var event_text = result[2];
    polulateEvent(event_name, event_text);
  }
}

function parseColorsConf(str) {
  if (!str) {
    console.log('parseColorsConf', 'Skipped importing this file');
    return; // File was not imported;
  }
  
  var re = /color_(\d+) = (\w{2})\w{2} (\w{2})\w{2} (\w{2})\w{2}/g;
  var result;
  var color_map = {};
  while ((result = re.exec(str)) !== null) {
    color_map[result[1]] = "#" + result[2] + result[3] + result[4];
  }
  setColors(color_map);
}

           
function init() {
  events = hexchat_events;
  buildEditor(events);
  setDefaults();
}

init();