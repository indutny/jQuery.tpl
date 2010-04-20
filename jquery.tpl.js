/**@license jQuery Tpl plugin v.0.3.18
 ** Copyright 2010, Fedor Indutny 
 ** Released with MIT license
 **/
(function(undefined) {
	/* Escaping closure */
	/** @return {Function} */
	function $eval(a) {
		return eval(a)[0];
	}
 
	 (function ($) {
		// cache
		var	cache = {},
				namecache ={},
				
				// regexps
				$brackets = /({%|%})/g,
				$modificator = /^([^\s]+)(?:\s|$)/,
				$tabs = /\t/gm,
				$spaces = /\s+/g,
				$decorator = /%1/,
	
				// attribute cache
				$tab = "\t",
				length = "length",
				replace = "replace",
	
				// functions
				$push = function (a,$_) {								
					
					// Push string or object into global output stack
					$_[$_[length]] =
						(a instanceof $) ?
							// If a is obj then push it's "ghost"
							// After, we will replace it with jQuery obj
							$insert_jQuery(a, this.$scope.$r) :
							// If string - simply put it in stack
							a;					
				},
				
				// modificators
				modificators = {
				
					// Direct output
					// Can handle jQuery object!
					// Example: {%= "hello world" %}
					/** @return {string} */
					"="	:	preg_decorate("$p(%1,$_);"),					
					
					// Short-hand for functions
					// Example: {%@ log() {console && console.log.apply(this,arguments);} %}
					/** @return {string} */
					"@"	:	preg_decorate("function %1"),
					
					// Short-hand for scopes
					// Example: {%~ alert(1) %}
					/** @return {string} */
					"~"	:	preg_decorate("(function(){%1})();"),
					
					// Short-hand for templates
					// Example: {%:templatename {arg1:val1,arg2:val2} %}
					/** @return {string} */
					":" : function (str) {
						var name = str.match($modificator);
						return "$p($.template('"+name[1]+"')(" + str.substr(name[0][length]) + "),$_);";
					},
					// Short-hand for each method
					// Example: {%each arr%}<div>{%=this%}</div>{%/each%}
					/** @return {string} */
					"each": preg_decorate("$.each(%1,function(){"),
					/** @return {string} */
					"/each": return_decorate("});"),
					// Catch
					// Example: {%catch var a%}<div></div>{%/catch%}{%= a%}
					/** @return {string} */
					"catch" : preg_decorate("%1=(function(){var $_=[];"),
					/** @return {string} */
					"/catch" : return_decorate("return $_.join('')})();")
				};
		// Generate function replacing pattern %1 in string
		/** @return {Function} */
		function preg_decorate(str) {		
			/** @return {string} */
			return function (s) {
				return str[replace]($decorator,s,str);
			};
		}
		
		// Generate function simply returning obj
		/** @return {Function} */
		function return_decorate(obj) {
			
			return function() {
				return obj;
			}
		}
		// System function that adds replacement to $r array in namespace ($scope)
		// And replaces original element with "<b ..></b>"
		/** @return {string} */
		function $insert_jQuery(a,$replace) {
			
			$replace[$replace[length]] = a;
			
			return "<br id='_jquery_tpl_"+($replace[length]-1)+"'/>";
		}
		
		// Render template, getting it from object
		// If name is defined - store into namecache
		// Also you can use this syntax:
		// $('...').render({arguments});
		// $('...').render("name");
		$.fn.render = function (name, args) {
			// We can call template without name
			(!args) &&
				(typeof name !== "string") &&
					(args = name) &&
						(name = undefined);
					
			var fn = $.template(
				// Code of element = template
				this.html(),
				// Variables = classes
				this[0].className.split($spaces),
				name
			);
			
			// If we have arguments - generate object
			// Else return jQuery
			return args ? fn(args): $;
		}
		
		// Generate, cache, return template
		// $.template("name") - get cached template with name
		// $.template("%template%", {args}, [name]) - generate template and optionally give it a name
		// Args = optional arguments that can be null
		/** @return {Function} */
		$.template = function (str , args, name) {
			// If have been cached by name
			// $.template("name")
			if (arguments[length] == 1) return namecache[str] || function () {};
			
			// If have been cached template
			// $.template("%template%" , [ ["arg1", ... , "argN"] ], ["name"])
			if (cache[str]) return namecache[name] = cache[str];		
			
			var	compiled,
					namespace = {
						// Storage for replacements
						$r	:	[],
						
						// Add push function
						$p: $push
					},
					// Index
					i,
					// Var count
					varcount = 0;				
					
			// Args can be undefined
			// Delete null elements
			args = 
				$.map(
					args || [] ,
					function(elem) {
						return elem || null
					}
				);
				
			// Add $_ to scope
			args[args[length]]="$_";
			
			// Preprocess template				
			// Go through each row
			// And replace it with code
			compiled = $.map(
				str[replace]($tabs," ")[replace]($brackets,$tab).split($tab),
				function ( elem, i) {
			
					if (i%2) {
						// Code
					
						// If there is modificator
						( (i = elem.match($modificator)) && ( i.f = modificators[ i[1] ]) ) &&
							// Use it to translate elem
							(
								elem = i.f(elem.substr(i[0][length]))
							);
						
							return elem;
					}
					
					// Text
					if (!elem)
						return null;
					// Push text into namespace as $(var number)
					namespace["$"+varcount] = elem;				
					// So, instead of inline printing we will print variable
					return "$p($"+(varcount++)+",$_);";				
					
							
				}
			// Then join all rows
			).join("");
			
			// Create function with overdriven args
			// In secure closure
			i = $eval("[function($args,"+args.join(",")+"){$_=[];with($args){(function(){" + compiled + "})();}return $_.join('');}]");						
			
			// Cache wrapper by str key
			// Replaces <b id="_jquery_tpl_[i]"></b> with "TRUE" jQuery objects
			// And so it's returning jQuery object
			cache[str] = function (args) {
				
				// Get result of wrapper
				var result = $("<b>"+cache[str].html(args)+"</b>"), i=namespace.$r.length-1;
				
				// For each replacement
				for (;i>=0;i--)
					// Find html element that must be replaced
					// Place object before, and delete original
					result.find('#_jquery_tpl_'+i).before(namespace.$r[i]).remove();
				
				// Clean replacements, because they are in main namespace
				namespace.$r = [];
				
				// Return jQuery object
				return result.find('>*');
			}
			
			// And cache it wrapper, that will recreate scope and call original function
			/** @return {string} */
			cache[str].html = function (args) {
				// Args can be null
				args = args || {},
				
				// Append namespace to args
				$.extend(true, args, namespace);
				
				// Attach permament scope to namespace	
				args.$scope = namespace;
				
				// Return result of execution				
				return i(args);
			}
			
			// If name is defined
			if (name)
				// Add to name cache
				namecache[name] = cache[str];
			
			// Return wrapper
			return cache[str];
		}
		// Add modificators to $.template
		$.template.modificators = modificators;
	})(jQuery);
})();