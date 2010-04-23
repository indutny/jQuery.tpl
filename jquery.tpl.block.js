/**@preserve jQuery.tpl block plugin v.0.0.1;Copyright 2010, Fedor Indutny;Released under MIT license **/
/**
* @param{array} data internal storage with gid as key
*/
(function ($ , data , length , blockStack , undefined) {
	
	/** @const */
	var ext = "e";
	/** @const */
	var namespace ="n";
	/** @const */
	var args =  "a";
	/** @const */
	var cached_args = "q";
	/** @const */
	var cached_$_ = "_";
	/** @const */
	var flag = "f";
	
	/**
	* This function will be called everytime with {%extends ... %} statement
	* @param{array} $_ template output stack
	* @param{int} gid id of template
	* @param{string} name name of template to extend
	* @param{object} argums argument that will be passed to template with block values
	*/
	function $extends($_ , gid , name , argums , junk , $this) {
	
		// Store template into internal storage
		data[gid][ext] = $.template(name);
		
		// Preprocess and prepare
		argums = argums || {};
		$this = this;
		
		// Change standart join function in output stack array
		// So when output will be created this function will be called
		$_.join = function () {
			
			// Create local output stack
			$_ = [];
			
			// Add block values if we have them
			argums[blockStack] = data[gid][args];			
			
			// Call cached template with arguments
			// And store output into $_ (it will be jQuery object)
			$this.$p(
				data
					[gid]
						[ext](
							argums
						)
			, $_);
			
			
			// Clear storage on this gid
			init(gid);
			
			// Return concatenated value
			return $_.join("");
		}		
		
	}
	
	/**
	* This function will be called everytime with {%block ... %} statement
	* @param{string} name Name of block
	* @param{int} gid Id of template
	* @param{function():string} code Block value function
	* @param{int} flag Is that first call of this function
	* @param{arary} $_ Output stack of template
	*/
	function $block(name, gid, code, flag, $_, cache,$args) {
		// Get data storage for gid
		cache=data[gid];
		
		// If we're here first time (during current run of template)
		if (!flag) {
		
			// Cache arguments and stack into storage
			$args = cache[cached_args] = this;
			cache[cached_$_]= $_;
		} else {
			// If not - get from cache
			$args = cache[cached_args];
			$_ = cache[cached_$_];		
		}
		
		// If we are just passing block values to template
		if (cache[ext]) {
		
			// Collect them to local storage
			// Then we will call template passing this like arguments
			(cache = data[gid][args][name]) ?
				(cache[cache[length]] = code([]))
				:
				(data[gid][args][name] = [ code([]) ]);
			
			// Stop
			return;
		}
		
		// Wow, some template want to pass us some arguments
		// Really?
		if ((flag = $args[blockStack]) && flag[name])
		
			// Get first value and slice array
			(cache = (code = flag[name])[0]) && (code[length]>1) && (flag[name] = code.slice(1));
		else
			// Simply get source
			cache= code([]);
			
		// And send it all to the output stack
		$args.$p(cache , $_);	
	}
	
	/**
	* This function is initializing datastorage(gid) with namespace
	* @param{int} gid Gid
	* @param{object} namespace Template's namespace
	*/
	function init(gid, namespace) {
		data [gid] = {};
		data [gid][args] = {};
		data [gid][namespace]=namespace || data[gid][namespace];
		data [gid][flag] = 0;
	}
	
	/**
	* This function is extending "init"'s behavior and return gid
	* @param{object} namespace
	* @return{int}
	*/
	function align(namespace) {
	
		// If allready is in local storage
		// Return gid
		if (data[namespace.$gid]) return namespace.$gid;
		
		// Initialize local storage
		init(namespace.$gid, namespace);
		
		// Add default functions
		namespace.$extends = $extends;
		namespace.$block = $block;
		
		// Return gid
		return namespace.$gid;
	}
	
	// Add modificators
	$.extend($.template.modificators,{
		"extends" : function (str , namespace) {
		
			return "$extends($_," + align(namespace) +	"," + str + ");";			
			
		},
		"block" : function (name , namespace) {
			
			return "$block(" + name + "," + align(namespace) + ",function($_){";
			
		},
		"/block" : function (junk, namespace, gid, store) {			
		
			gid = align(namespace);
			store = data[gid][flag];
			// Mark first time traveling
			data[gid][flag] = 1;
			
			return ";return $_.join('')},"+store + (store ? ");" : ",$_);");
			
		}
	});
	
	// Pass some constants
})(jQuery,{},"length","$blockStack");