// This is just shameless copy-pasta from TIYO's client side js
function shameless() {
  $('textarea[data-runnable]').each(function() {
    var lang = $(this).attr('data-lang');
    var $textarea = $(this);
    var originalText = $textarea.val();

    var editor = CodeMirror.fromTextArea($textarea[0], {
      lineNumbers: true,
      lineWrapping: true,
      mode: lang,
      styleSelectedText: true,
      theme: 'material'
    });

    var $parent = $(this).parent();

    $parent.prepend('<span class="code-eval-label">Code:</span>');
    $parent.append('<div class="code-eval-utility"> \
      <button data-run class="btn-eval btn">Run Code</button> \
      <button data-reset class="btn-eval-reset btn">Reset</button> \
      </div><span class="code-eval-label">Result:</span> \
      <textarea data-result></textarea>');

    var result = CodeMirror.fromTextArea($parent.find('[data-result]')[0], {
      lineNumbers: true,
      lineWrapping: true,
      readOnly: true,
      mode: 'plaintext',
      styleSelectedText: true,
      theme: 'material'
    });

    $parent.find('[data-run]').click(function() {
      if (editor.getValue().trim()) {
        result.getDoc().setValue('Evaluating...');
        $.post('/library/eval/run', {
          code: editor.getValue(),
          lang: lang,
        }).success(function(data) {
          if (data.logs.trim()) {
            result.getDoc().setValue(data.logs);
          } else {
            result.getDoc().setValue('Evaluation complete. Nothing printed to STDOUT. Did you forget something?');
          }
        });
      } else {
        result.getDoc().setValue('Please enter some code before evaluating.');
      }
    });

    $parent.find('[data-reset]').click(function() {
      editor.setValue(originalText);
    });
  });
};
