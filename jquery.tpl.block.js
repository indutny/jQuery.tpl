/**@preserve jQuery.tpl block plugin v.0.0.1;Copyright 2010, Fedor Indutny;Released under MIT license **/
(function ($,undefined,data, length) {
	data = {};
	length= "length";
	/** @const */
	var ext = "e";
	/** @const */
	var namespace ="n";
	/** @const */
	var args =  "a";
	
	function $extends($_,gid,name, argums,  junk, $this) {
	
		data[gid][ext] = $.template(name);
		$this = this;		
		$_.join = function ($_) {
			
			$_ = [];						
			$this.$p(
				data
					[gid]
						[ext](
							$.extend(
								{$blockStack : data[gid][args]}
								, argums
							)
						)
			, $_);
			
			init(gid);
			
			return Array.prototype.join.call($_, "");
		}		
		
	}
	
	function $block($args, $_, name, gid, code, cache) {
		if (data[gid][ext]) {
			// If calling from extending template
			(cache = data[gid][args][name]) ?
				(cache[cache[length]] = code([]))
				:
				(data[gid][args][name] = [ code([]) ]);
			
			return;
		}
		
		// If calling from extended template			
		if ($args.$blockStack && $args.$blockStack[name])
			(cache = (code = $args.$blockStack[name])[0]) && (code[length]>1) && ($args.$blockStack[name] = code.slice(1));
		else
			cache= code([]);
		$args.$p(cache , $_);	
	}
	
	function init(gid, namespace) {
		data [gid] = {};
		data[gid][args] = {};
		data [gid][namespace]=namespace || data[gid][namespace];
		
	}
	
	function align(namespace, junk) {
		if (data[namespace.$gid]) return namespace.$gid;
		
		init(namespace.$gid, namespace);
		
		$.extend(namespace,{
			$extends : $extends,
			$block : $block		});
		
		return namespace.$gid;
	}
	
	$.extend($.template.modificators,{
		"extends" : function (str , namespace) {
			return [
				"$extends($_,",
				align(namespace),
				",",
				str,
				");"
			].join("");
			
		},
		"block" : function (name , namespace) {
			return "$block($args,$_," + name + "," +  align(namespace) + ",function($_){";
			
		},
		"/block" : function (junk, namespace) {			
		
			return ";return $_.join('')});";			
		}
	});
})(jQuery);