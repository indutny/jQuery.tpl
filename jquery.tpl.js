/**@preserve jQuery.tpl plugin v.0.5.2;Copyright 2010, Fedor Indutny;Released under MIT license **/
/**
* Note that there're some core changes:
* All variables that you want to use in template must be defined in second argument of $.template or in className of element(if using $.render)
* If you pass variable, that's not defined before - it will be available only as $args.varName
* This is because of speed of execution of "with" method (no compiler optimizations)
*/
(function($ , undefined) {

	/** Escaping closure
	 * Only global variables will be available here
	 * @return {Function}
	 */
	function $eval(a) {
		return eval(a)[0];
	}
 
	 (function ($tab , gid ,
	                cache , namecache , $brackets , $modificator ,
					$tabs , $spaces , $decorator , modificators) {				
					
				function map(arr, call) {
					if (arr.map)
						return arr.map(call);
						
					for (var i=0 , len = arr.length ; i<len ; i++)
						arr[i] = call(arr[i],i);
					
					return arr;
				}
				// Built-in functions
				/**
				*	Push object into output
				*	@param {string|object} a Object to push
				*	@param {array} $_ Output stack
				*	@return {string}
				*/
				function $push(a,$_,$r) {								
					
					// Push string or object into global output stack
					return $_[$_.length] =
						(a instanceof $) ?
							// If a is obj then push it's "ghost"
							// After, we will replace it with jQuery obj
							$insert_jQuery(a, $r) :
							// If string - simply put it in stack
							a;					
				};
				
				// Modificators
				modificators = {
				
					// Direct output
					// Can handle jQuery object!
					// Example: {%= "hello world" %}
					/** @return {string} */
					"="	:	preg_decorate("$p(%1,$_,$r);"),					
					
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
					":" : function (str , name) {
					
						name = str.match($modificator);
						
						return "$p($.template('" + name[1] + "')(" + str.substr(name[0].length) + "),$_,$r);";
					},
					
					// "if", "else", "elseif"
					// Example: {%if true%}I'm right!{%else%}I'm wrong{%/if%}
					// {%if false%}I'm wrong{%elseif true%}I'm true!{%/if%}
					/** @return {string} */
					"if": preg_decorate("if(%1){"),
					/** @return {string} */
					"else": return_decorate("}else{"),
					/** @return {string} */
					"elseif": preg_decorate("}else if(%1){"),
					/** @return {string} */
					
					"/if": return_decorate("}"),					
					// Short-hand for each method
					// Example: {%each arr%}<div>{%=this%}</div>{%/each%}
					/** @return {string} */
					"each": preg_decorate("$.each(%1,function($i){"),
					/** @return {string} */
					"/each": return_decorate("});"),
					
					// Catch
					// Example: {%catch var a%}<div></div>{%/catch%}{%= a%}
					/** @return {string} */
					"catch" : preg_decorate("%1=(function(){var $_=[];"),
					/** @return {string} */
					"/catch" : return_decorate("return $_.join('')})();")
				};
				
			/**
			*	Generate function replacing pattern %1 in string
			*	@param {string} str string with pattern
			*	@return {function(string): string}
			*/
		function preg_decorate(str) {		
			/**
			* @param {string} s string to insert into str
			* @return {string}
			*/
			return function (s) {
				return str.replace($decorator , s , str);
			};
		}
		
		/**
		*	Generate function simply returning obj
		*	@param {string} obj object to return
		*	@return {function(): string}
		*/
		function return_decorate(obj) {
			/**
			* @return {string}
			*/
			return function() {
				return obj;
			}
		}
		
		/**
		*	System function that adds replacement to $r array in namespace ($scope)
		*	And replaces original element with "<b ../>"
		*	@param {object} a jQuery object to insert
		*	@param {array} $replace Array that handles insertions
		*	@return {string}
		*/
		function $insert_jQuery(a , $replace) {
			
			$replace[ $replace.length ] = a;
			
			return "<b id='_jquery_tpl_" + ($replace.length-1) + "'/>";
		}
		
		/**
		* Render template, getting it from object
		* If name is defined - store into namecache
		* Also you can use this syntax:
		* $('...').render({arguments});
		* $('...').render("name");
		* @param {string|object} name Template name or arguments
		* @return {object}
		*/
		$.fn.render = function (name, args,fn, $this) {
			$this = this;
			// We can call template without name
			(!args) &&
				(typeof name !== "string") &&
					(args = name) &&
						(name = undefined);
					
			fn = $.template(
				// Code of element = template
				$this.html(),
				// Variables = classes
				($this[0]&&($this = $this[0].className)) ? $this.split($spaces) : [],
				name
			);
			
			// If we have arguments - generate object
			// Else return jQuery
			return args ? fn(args): $;
		}
		
		/**
		* Generate, cache, return template
		* $.template("name") - get cached template with name
		* $.template("%template%", {args}, [name]) - generate template and optionally give it a name
		* Args = Template arguments
		* @param {string} str Input template, or template name
		* @return {function(object): object}
		*/
		$.template = function (str , args, name) {
			// If have been cached by name
			// $.template("name")
			if ((arguments.length == 1) && (i = namecache[str]))
				return i;
			
			// If have been cached template
			// $.template("%template%" , [ ["arg1", ... , "argN"] ], ["name"])
			if ((i = cache[str]) && (i = i[conv_args = (args+"") ]))
				return namecache[name] = i;
			
			var	compiled,
					namespace = {
						// Storage for replacements
						$r	:	[],
						// Global template Id, may be used by plugins
						$gid: gid++
					},
					local,
					// Index
					i,
					// Args converted to string
					// Need them for caching
					conv_args,
					// Var count
					varcount = 0;							
					
			// Add $_ to scope
			// And check that args is array
			( args instanceof Array) ? (args[ args.length ]="$_") : (args = ["$_"]);
			
			
			
			// Preprocess template				
			// Go through each row
			// And replace it with code
			compiled = str ? map(
				str
					.replace($tabs , " ")
						.replace($brackets , $tab)
							.split($tab),
				function ( elem, i) {
			
					if (i%2) {
						// Code
					
						// If there is modificator
						( (i = elem.match($modificator)) && ( i.f = modificators[ i[1] ]) ) &&
							// Use it to translate elem
							(
								elem = i.f(elem.substr(i[0].length), namespace)
							);
						
							return elem;
					}
					
					// Text
					if (!elem)
						return null;
						
					// Push text into namespace as $(var number)
					namespace[ (args[ args.length ] = "$" + varcount) ] = elem;
					
					// So, instead of inline printing we will print variable
					return "$p($" + ( varcount++ ) + ",$_,$r);";				
					
							
				}
			// Then join all rows
			).join("") : "";
			
	
			// Create function with overdriven args
			// In secure closure
			i = $eval("[function($scope,$args,$p,$r," + args.join(",") + "){$_=[];" + compiled + ";return $_.join('');}]");						
			
			/**
			* Cache wrapper by str key
			* Replaces <b id="_jquery_tpl_[i]"></b> with "TRUE" jQuery objects
			* And so it's returning jQuery object
			* @param {object} args Input arguments
			* @return {object}
			*/
			
			local = (cache[str] = cache[str] || {} )[conv_args] = function (args, result, i) {
				
				// Get result of wrapper
				result = $("<b>" + local.html(args) + "</b>");
				
				// For each replacement				
				for (i = namespace.$r.length - 1;i>=0;i--)
				
					// Find html element that must be replaced
					// Place object before, and delete original
					result
						.find('#_jquery_tpl_' + i)
							.before( namespace.$r[i] )
								.remove();
				
				// Clean replacements, because they are in main namespace
				namespace.$r = [];
				
				// Return jQuery object
				return result.find('>*');
			}
			
			/**
			* Generate arguments array that will be passed to template function
			* @param {array} args Default arguments that was passed on creation
			* @param {object} callArgs Arguments that will be used now
			* @return {array}
			*/
			function createArguments(callArgs,result,i) {
			
				result = [ namespace, callArgs , $push , namespace.$r ];
				
				for (i in args)					
					result[ result.length ] = callArgs[ args[i] ];
				
				return result;
				
			}
			
			
			/**
			*	And cache it wrapper, that will recreate scope and call original function
			*	@param {object} args arguments to pass
			*	@return {string}
			*/
			local.html = function (callArgs) {
				// Args can be null
				callArgs = callArgs || {},
				
				// Append namespace to args
				$.extend(true, callArgs, namespace);
				
				// Attach permament scope to namespace	
				
				// Return result of execution				
				return i.apply(undefined , createArguments( callArgs ));
			}
			
			// If name is defined
			name &&
				// Add to name cache
				(namecache[name] = local);
			
			// Return wrapper
			return local;
		}
		
		// Add modificators to $.template
		$.template.modificators = modificators;
		
		// Constants and cache
	})( "\t" ,  0 ,
	     {} , {} , /{%|%}/g , /^([^\s]+|=)(?:\s|$)/ ,
		 /\t/g , /\s+/g , /%1/);
})(jQuery);