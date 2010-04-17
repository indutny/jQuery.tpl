/**@license jQuery Tpl plugin v.0.3.15
 ** Copyright 2010, Fedor Indutny 
 ** Dual licensed under the Creative Commons 3.0 BY or GPL Version 2 licenses.
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
				$brackets = /({%|%})/gm,
				$modificator = /^([^\s]+)(?:\s|$)/,
				$tabs = /\t/gm,
				$spaces = /\s+/gm,
				$decorator = /%1/,
				// attribute cache
				length = "length",
				replace = "replace",
				// functions
				$push = function (a,_this) {								
					
					// Push string or object into global output stack
					(_this=this).$_[_this.$_[length]] =
						(a instanceof $) ?
							// If a is obj then push it's "ghost"
							// After, we will replace it with jQuery obj
							$insert_jQuery(a, _this.$scope.$r) :
							// If string - simply put it in stack
							a;					
				},
				/** @return {string} */
				$deploy = function (){					
					// Return concatenated global output stack
					return this.$_.join("");
				},
				/** @return {string} */
				$catch = function ( callback ,_this){
					// Store old ouput stack
					var 
						  old = (_this=this).$_;
					
					// Create local new
					_this.$_=[];
					
					// Run function in local output stack
					callback();
					
					// Get output of result
					callback = _this.$_.join('');
					
					// Revert to original
					_this.$_= old;
					
					// Return result
					return callback;
				},
				// modificators
				modificators = {
				
					// Direct output
					// Can handle jQuery object!
					// Example: {%= "hello world" %}
					/** @return {string} */
					"="	:	preg_decorate("$p(%1);"),					
					
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
						return "$p($.template('"+name[1]+"')(" + str.substr(name[0][length]) + "));";
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
					"catch" : preg_decorate("%1=$c(function(){"),
					/** @return {string} */
					"/catch" : return_decorate("});")
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
			
			return "<b id='_jquery_tpl_"+($replace[length]-1)+"'></b>";
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
			if (arguments[length]===1) return namecache[str] || function () {};
			
			// If have been cached template
			// $.template("%template%" , [ ["arg1", ... , "argN"] ], ["name"])
			if (cache[str]) return cache[str];		
					
			var	namespace = {
						$r	:	[]
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
			args[args.length]="$$";
			
			// Preprocess template				
			// Go through each row
			// And replace it with code
			str = $.map(
				str[replace]($tabs," ")[replace]($brackets,"\t").split("\t"),
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
					if (elem === "")
						return null;
					// Push text into namespace as $(var number)
					namespace["$"+varcount] = elem;				
					// So, instead of inline printing we will print variable
					return "$p($"+(varcount++)+");";				
					
							
				}
			// Then join all rows
			).join("");
			
			// Create function with overdriven args
			// In secure closure
			i = $eval("[function($args,"+args.join(",")+"){with($args){(function(){"+str +"})();return $d();}}]");						
			
			// Cache wrapper by str key
			// Replaces <b id="_jquery_tpl_[i]"></b> with "TRUE" jQuery objects
			// And so it's returning jQuery object
			cache[str] = function (args) {
				
				// Get result of wrapper
				var result = $("<b>"+cache[str].html(args)+"</b>");
				
				// For each replacement
				for (var i in namespace.$r)				
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
				// So we must handle it
				// "_" - is accumulator of output
				// "p" - pushes data into "_"
				// "d" - joins all rows in "_" and returns output string
				$.extend(
					(args = args || {}),
					{
						$_			:	[],
						$p			:	$push,
						$d			:	$deploy,
						$c			:	$catch
					}
				);
							
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